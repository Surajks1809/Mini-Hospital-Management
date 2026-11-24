import { Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'medicare_super_secret_jwt_key_2026_enterprise_production';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let hospitalId = req.user?.hospitalId;

    // Check Authorization header if not already decoded by middleware
    if (!hospitalId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        hospitalId = decoded?.hospitalId;
      } catch (err) {
        // ignore invalid token, fallback
      }
    }

    let hospital = null;
    if (hospitalId) {
      hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId },
      });
    }

    if (!hospital) {
      // Fallback to default hospital for unauthenticated login branding
      hospital = await prisma.hospital.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital profile not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: hospital.id,
        hospitalName: hospital.name,
        hospitalLogo: hospital.hospitalLogo,
        tagline: hospital.tagline,
        address: hospital.address,
        phone: hospital.phone,
        email: hospital.email,
        emergencyContact: hospital.emergencyContact,
        website: hospital.website,
        currency: hospital.currency,
        taxRate: hospital.taxRate,
        gstNumber: hospital.gstNumber,
        invoicePrefix: hospital.invoicePrefix,
        patientPrefix: hospital.patientPrefix,
      },
    });
  } catch (error: any) {
    console.error('getSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve hospital settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(401).json({ success: false, message: 'Hospital context required' });
    }

    const {
      hospitalName,
      name,
      hospitalLogo,
      tagline,
      address,
      phone,
      email,
      emergencyContact,
      website,
      currency,
      taxRate,
      gstNumber,
    } = req.body;

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...((hospitalName || name) && { name: (hospitalName || name).trim() }),
        ...(hospitalLogo !== undefined && { hospitalLogo }),
        ...(tagline && { tagline: tagline.trim() }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email && { email: email.trim() }),
        ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
        ...(website && { website: website.trim() }),
        ...(currency && { currency: currency.trim() }),
        ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) }),
        ...(gstNumber && { gstNumber: gstNumber.trim() }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Hospital settings updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

export const resetDemoData = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(401).json({ success: false, message: 'Hospital context required' });
    }

    // Clear only this hospital's data (keeping other hospitals completely safe!)
    await prisma.payment.deleteMany({
      where: { invoice: { hospitalId } },
    });
    await prisma.invoiceItem.deleteMany({
      where: { invoice: { hospitalId } },
    });
    await prisma.invoice.deleteMany({ where: { hospitalId } });
    await prisma.appointment.deleteMany({ where: { hospitalId } });
    await prisma.patient.deleteMany({ where: { hospitalId } });
    await prisma.doctor.deleteMany({ where: { hospitalId } });

    return res.status(200).json({
      success: true,
      message: 'Your hospital data has been cleared and reset to fresh clean state. Ready for new entries.',
    });
  } catch (error: any) {
    console.error('resetDemoData error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset hospital data' });
  }
};
