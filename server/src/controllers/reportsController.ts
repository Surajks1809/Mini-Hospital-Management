import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getReportsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }

    const hasDate = startDate || endDate;

    // Total registered patients in this hospital
    const patientWhere: any = { hospitalId };
    if (hasDate) patientWhere.registrationDate = dateFilter;
    const totalPatients = await prisma.patient.count({ where: patientWhere });

    // Appointments summary for this hospital
    const aptWhere: any = { hospitalId };
    if (hasDate) aptWhere.appointmentDate = dateFilter;

    const [totalAppointments, completedAppointments, cancelledAppointments] = await Promise.all([
      prisma.appointment.count({ where: aptWhere }),
      prisma.appointment.count({ where: { ...aptWhere, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { ...aptWhere, status: 'CANCELLED' } }),
    ]);

    // Revenue & pending payments summary for this hospital
    const invWhere: any = { hospitalId };
    if (hasDate) invWhere.billingDate = dateFilter;

    const invoices = await prisma.invoice.findMany({
      where: invWhere,
      select: { grandTotal: true, amountPaid: true, balanceAmount: true, paymentStatus: true },
    });

    const totalBilled = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const totalPending = invoices.reduce((s, i) => s + i.balanceAmount, 0);

    // Doctor-wise appointment breakdown for this hospital
    const doctors = await prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        appointments: {
          where: aptWhere,
          select: { id: true, status: true },
        },
      },
    });

    const doctorStats = doctors.map((doc) => ({
      doctorId: doc.doctorId,
      doctorName: doc.name,
      specialization: doc.specialization,
      department: doc.department,
      totalAppointments: doc.appointments.length,
      completed: doc.appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: doc.appointments.filter((a) => a.status === 'CANCELLED').length,
      revenueGenerated: doc.appointments.filter((a) => a.status === 'COMPLETED').length * doc.consultationFee,
    }));

    return res.status(200).json({
      success: true,
      summary: {
        totalPatients,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalBilled: Math.round(totalBilled),
        totalCollected: Math.round(totalCollected),
        totalPending: Math.round(totalPending),
      },
      doctorStats,
    });
  } catch (error: any) {
    console.error('getReportsSummary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports data' });
  }
};

export const exportReportCsv = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const type = req.query.type as string; // 'patients', 'revenue', 'appointments', 'doctors'
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      dateFilter.lte = e;
    }
    const hasDate = startDate || endDate;

    let csvContent = '';
    let filename = `medicare_report_${type || 'general'}_${Date.now()}.csv`;

    if (type === 'patients') {
      const where: any = { hospitalId };
      if (hasDate) where.registrationDate = dateFilter;
      const patients = await prisma.patient.findMany({ where, orderBy: { registrationDate: 'desc' } });
      csvContent = 'Patient ID,Full Name,Gender,Age,Phone,Email,Blood Group,Emergency Contact,Registration Date\n';
      patients.forEach((p) => {
        csvContent += `"${p.patientId}","${p.fullName}","${p.gender}","${p.age}","${p.phone}","${p.email || ''}","${p.bloodGroup}","${p.emergencyContact}","${p.registrationDate.toISOString().split('T')[0]}"\n`;
      });
    } else if (type === 'revenue' || type === 'invoices') {
      const where: any = { hospitalId };
      if (hasDate) where.billingDate = dateFilter;
      const invoices = await prisma.invoice.findMany({
        where,
        include: { patient: true },
        orderBy: { billingDate: 'desc' },
      });
      csvContent = 'Invoice Number,Patient ID,Patient Name,Grand Total (INR),Amount Paid (INR),Balance (INR),Payment Status,Payment Method,Billing Date\n';
      invoices.forEach((inv) => {
        csvContent += `"${inv.invoiceNumber}","${inv.patient?.patientId}","${inv.patient?.fullName}","${inv.grandTotal}","${inv.amountPaid}","${inv.balanceAmount}","${inv.paymentStatus}","${inv.paymentMethod}","${inv.billingDate.toISOString().split('T')[0]}"\n`;
      });
    } else if (type === 'doctors') {
      const doctors = await prisma.doctor.findMany({
        where: { hospitalId },
        include: { appointments: true },
        orderBy: { name: 'asc' },
      });
      csvContent = 'Doctor ID,Name,Specialization,Department,Phone,Email,Consultation Fee,Status,Total Appointments\n';
      doctors.forEach((d) => {
        csvContent += `"${d.doctorId}","${d.name}","${d.specialization}","${d.department}","${d.phone}","${d.email}","${d.consultationFee}","${d.availabilityStatus}","${d.appointments.length}"\n`;
      });
    } else {
      const where: any = { hospitalId };
      if (hasDate) where.appointmentDate = dateFilter;
      const appointments = await prisma.appointment.findMany({
        where,
        include: { patient: true, doctor: true },
        orderBy: { appointmentDate: 'desc' },
      });
      csvContent = 'Appointment ID,Patient Name,Patient ID,Doctor Name,Department,Date,Time,Status,Reason\n';
      appointments.forEach((a) => {
        csvContent += `"${a.appointmentId}","${a.patient?.fullName}","${a.patient?.patientId}","${a.doctor?.name}","${a.department}","${a.appointmentDate.toISOString().split('T')[0]}","${a.appointmentTime}","${a.status}","${a.reasonForVisit}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('exportReportCsv error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV report' });
  }
};
