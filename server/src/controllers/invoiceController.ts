import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const generateNextInvoiceNumber = async (hospitalId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { hospitalId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  if (!lastInvoice) return `${prefix}0001`;
  const parts = lastInvoice.invoiceNumber.split('-');
  const num = parseInt(parts[parts.length - 1], 10);
  const next = isNaN(num) ? 1 : num + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const paymentMethod = req.query.paymentMethod as string;
    const patientId = req.query.patientId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const skip = (page - 1) * limit;
    const where: any = {
      hospitalId, // Tenant isolation
    };

    if (status && status !== 'ALL') {
      where.paymentStatus = status;
    }
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }
    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { patient: { fullName: { contains: search, mode: 'insensitive' } } },
            { patient: { patientId: { contains: search, mode: 'insensitive' } } },
            { doctorName: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (startDate || endDate) {
      where.billingDate = {};
      if (startDate) where.billingDate.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.billingDate.lte = e;
      }
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { billingDate: 'desc' },
        include: {
          patient: {
            select: { id: true, patientId: true, fullName: true, phone: true, email: true, address: true },
          },
          items: true,
          payments: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('getInvoices error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices' });
  }
};

export const getInvoiceById = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const invoice = await prisma.invoice.findFirst({
      where: {
        hospitalId,
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        patient: true,
        items: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const settings = await prisma.hospital.findUnique({ where: { id: hospitalId } });

    return res.status(200).json({ success: true, data: invoice, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoice details' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      patientId,
      doctorName,
      consultationCharges = 0,
      medicineCharges = 0,
      laboratoryCharges = 0,
      otherCharges = 0,
      discount = 0,
      taxRate,
      paymentMethod = 'CASH',
      paymentStatus = 'PENDING',
      amountPaid = 0,
      billingDate,
      notes,
      items = [],
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient selection is mandatory for billing' });
    }

    let effectiveTaxRate = taxRate;
    if (effectiveTaxRate === undefined || effectiveTaxRate === null) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      effectiveTaxRate = hospital?.taxRate ?? 5.0;
    }

    const cCharge = parseFloat(consultationCharges) || 0;
    const mCharge = parseFloat(medicineCharges) || 0;
    const lCharge = parseFloat(laboratoryCharges) || 0;
    const oCharge = parseFloat(otherCharges) || 0;
    const disc = parseFloat(discount) || 0;
    let paid = parseFloat(amountPaid) || 0;

    const subtotal = cCharge + mCharge + lCharge + oCharge;
    const taxableAmount = Math.max(0, subtotal - disc);
    const taxAmount = (taxableAmount * effectiveTaxRate) / 100;
    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // If marked as PAID upfront without specific amount, treat full balance as paid
    if (paymentStatus === 'PAID' && paid === 0) {
      paid = grandTotal;
    }

    const balanceAmount = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);

    let calculatedStatus = paymentStatus;
    if (paid >= grandTotal && grandTotal > 0) {
      calculatedStatus = 'PAID';
    } else if (paid > 0 && paid < grandTotal) {
      calculatedStatus = 'PARTIALLY_PAID';
    } else if (paid === 0) {
      calculatedStatus = 'PENDING';
    }

    const invoiceNumber = await generateNextInvoiceNumber(hospitalId);

    const invoice = await prisma.invoice.create({
      data: {
        hospitalId, // Tenant isolation
        invoiceNumber,
        patientId,
        doctorName: doctorName?.trim(),
        consultationCharges: cCharge,
        medicineCharges: mCharge,
        laboratoryCharges: lCharge,
        otherCharges: oCharge,
        subtotal,
        discount: disc,
        taxRate: effectiveTaxRate,
        taxAmount,
        grandTotal,
        amountPaid: paid,
        balanceAmount,
        paymentMethod,
        paymentStatus: calculatedStatus,
        billingDate: billingDate ? new Date(billingDate) : new Date(),
        notes: notes?.trim(),
        items: {
          create: items.map((it: any) => ({
            description: it.description || 'Medical Service / Drug',
            category: it.category || 'OTHER',
            quantity: parseInt(it.quantity, 10) || 1,
            unitPrice: parseFloat(it.unitPrice) || 0,
            total: (parseInt(it.quantity, 10) || 1) * (parseFloat(it.unitPrice) || 0),
          })),
        },
        ...(paid > 0
          ? {
              payments: {
                create: {
                  amount: paid,
                  paymentMethod,
                  receivedBy: 'Billing Counter',
                  notes: 'Initial payment during invoice generation',
                },
              },
            }
          : {}),
      },
      include: {
        patient: true,
        items: true,
        payments: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error: any) {
    console.error('createInvoice error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const { amountPaid, paymentMethod, paymentStatus, notes } = req.body;

    const existing = await prisma.invoice.findFirst({ where: { id, hospitalId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const newPayment = parseFloat(amountPaid) || 0;
    const totalPaid = Math.min(existing.grandTotal, existing.amountPaid + newPayment);
    const balance = Math.max(0, existing.grandTotal - totalPaid);

    let status = paymentStatus;
    if (!status) {
      if (balance <= 0) status = 'PAID';
      else if (totalPaid > 0) status = 'PARTIALLY_PAID';
      else status = 'PENDING';
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: totalPaid,
        balanceAmount: balance,
        paymentStatus: status,
        ...(paymentMethod && { paymentMethod }),
        ...(newPayment > 0 && {
          payments: {
            create: {
              amount: newPayment,
              paymentMethod: paymentMethod || existing.paymentMethod,
              notes: notes || 'Payment update',
            },
          },
        }),
      },
      include: { patient: true, items: true, payments: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('updatePaymentStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    await prisma.invoice.delete({ where: { id, hospitalId } });
    return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
};
