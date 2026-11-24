import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Dynamic database aggregations scoped to this user's hospital
    const [
      totalPatients,
      todayAppointmentsCount,
      totalDoctors,
      paidInvoicesSum,
      pendingInvoicesSum,
      recentPatients,
      upcomingAppointments,
      recentInvoices,
    ] = await Promise.all([
      prisma.patient.count({ where: { hospitalId } }),
      prisma.appointment.count({
        where: {
          hospitalId,
          appointmentDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.doctor.count({ where: { hospitalId } }),
      prisma.invoice.aggregate({
        where: { hospitalId },
        _sum: { amountPaid: true },
      }),
      prisma.invoice.aggregate({
        where: {
          hospitalId,
          paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        _sum: { balanceAmount: true },
      }),
      prisma.patient.findMany({
        where: { hospitalId },
        take: 5,
        orderBy: { registrationDate: 'desc' },
        select: {
          id: true,
          patientId: true,
          fullName: true,
          gender: true,
          age: true,
          phone: true,
          bloodGroup: true,
          registrationDate: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          hospitalId,
          appointmentDate: { gte: todayStart },
          status: 'SCHEDULED',
        },
        take: 5,
        orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
        include: {
          patient: { select: { fullName: true, patientId: true, phone: true } },
          doctor: { select: { name: true, specialization: true, department: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { hospitalId },
        take: 5,
        orderBy: { billingDate: 'desc' },
        include: {
          patient: { select: { fullName: true, patientId: true } },
        },
      }),
    ]);

    // Monthly revenue chart data for last 6 months scoped to this hospital
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = startOfMonth.toLocaleString('default', { month: 'short' });

      const monthInvoices = await prisma.invoice.findMany({
        where: {
          hospitalId,
          billingDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        select: { amountPaid: true, grandTotal: true },
      });

      const collected = monthInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
      const billed = monthInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);

      monthlyRevenue.push({
        month: monthName,
        revenue: Math.round(collected),
        billed: Math.round(billed),
      });
    }

    // Patient registration trends for the last 7 days scoped to this hospital
    const patientTrends = [];
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() - i);
      const dStart = new Date(dayDate);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(dayDate);
      dEnd.setHours(23, 59, 59, 999);

      const count = await prisma.patient.count({
        where: {
          hospitalId,
          registrationDate: {
            gte: dStart,
            lte: dEnd,
          },
        },
      });

      const dayName = dStart.toLocaleDateString('default', { weekday: 'short' });
      patientTrends.push({
        day: dayName,
        date: dStart.toISOString().split('T')[0],
        patients: count,
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        todayAppointments: todayAppointmentsCount,
        totalDoctors,
        totalRevenue: Math.round(paidInvoicesSum._sum.amountPaid || 0),
        pendingPayments: Math.round(pendingInvoicesSum._sum.balanceAmount || 0),
      },
      charts: {
        monthlyRevenue,
        patientTrends,
      },
      recent: {
        patients: recentPatients,
        appointments: upcomingAppointments,
        invoices: recentInvoices,
      },
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard statistics' });
  }
};
