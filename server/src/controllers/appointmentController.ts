import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const generateNextAppointmentId = async (hospitalId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `APT-${currentYear}-`;

  const lastApt = await prisma.appointment.findFirst({
    where: { hospitalId, appointmentId: { startsWith: prefix } },
    orderBy: { appointmentId: 'desc' },
  });

  if (!lastApt) return `${prefix}001`;
  const parts = lastApt.appointmentId.split('-');
  const num = parseInt(parts[parts.length - 1], 10);
  const next = isNaN(num) ? 1 : num + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const doctorId = req.query.doctorId as string;
    const patientId = req.query.patientId as string;
    const date = req.query.date as string;
    const filter = req.query.filter as string; // 'today', 'upcoming', 'all'
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;
    const where: any = {
      hospitalId, // Tenant isolation
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (doctorId && doctorId !== 'ALL') {
      where.doctorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (filter === 'today') {
      where.appointmentDate = {
        gte: todayStart,
        lte: todayEnd,
      };
    } else if (filter === 'upcoming') {
      where.appointmentDate = {
        gte: todayStart,
      };
      if (!status) {
        where.status = 'SCHEDULED';
      }
    } else if (date) {
      const dStart = new Date(date);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setHours(23, 59, 59, 999);
      where.appointmentDate = {
        gte: dStart,
        lte: dEnd,
      };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { appointmentId: { contains: search, mode: 'insensitive' } },
            { reasonForVisit: { contains: search, mode: 'insensitive' } },
            { patient: { fullName: { contains: search, mode: 'insensitive' } } },
            { doctor: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
        include: {
          patient: {
            select: { id: true, patientId: true, fullName: true, phone: true, gender: true, age: true },
          },
          doctor: {
            select: { id: true, doctorId: true, name: true, specialization: true, department: true, consultationFee: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('getAppointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments' });
  }
};

export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const appointment = await prisma.appointment.findFirst({
      where: {
        hospitalId,
        OR: [{ id }, { appointmentId: id }],
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointment' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      patientId,
      doctorId,
      department,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      status,
      notes,
    } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !reasonForVisit) {
      return res.status(400).json({
        success: false,
        message: 'Missing required appointment fields (patient, doctor, date, time, reason)',
      });
    }

    const aptDate = new Date(appointmentDate);
    aptDate.setHours(0, 0, 0, 0);

    // Prevent duplicate appointments for the same doctor, date and time in THIS hospital
    const duplicate = await prisma.appointment.findFirst({
      where: {
        hospitalId,
        doctorId,
        appointmentDate: aptDate,
        appointmentTime: appointmentTime.trim(),
        status: { in: ['SCHEDULED', 'COMPLETED'] },
      },
      include: { doctor: true },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Dr. ${duplicate.doctor.name} already has a confirmed appointment at ${appointmentTime} on this date. Please select a different time slot.`,
      });
    }

    let dept = department;
    if (!dept) {
      const doc = await prisma.doctor.findFirst({ where: { id: doctorId, hospitalId } });
      dept = doc?.department || 'General Medicine';
    }

    const appointmentId = await generateNextAppointmentId(hospitalId);

    const appointment = await prisma.appointment.create({
      data: {
        hospitalId, // Tenant isolation
        appointmentId,
        patientId,
        doctorId,
        department: dept,
        appointmentDate: aptDate,
        appointmentTime: appointmentTime.trim(),
        reasonForVisit: reasonForVisit.trim(),
        status: status || 'SCHEDULED',
        notes: notes?.trim(),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: appointment,
    });
  } catch (error: any) {
    console.error('createAppointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const {
      patientId,
      doctorId,
      department,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      status,
      notes,
    } = req.body;

    let aptDate: Date | undefined;
    if (appointmentDate) {
      aptDate = new Date(appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
    }

    if (doctorId && aptDate && appointmentTime) {
      const duplicate = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          hospitalId,
          doctorId,
          appointmentDate: aptDate,
          appointmentTime: appointmentTime.trim(),
          status: { in: ['SCHEDULED', 'COMPLETED'] },
        },
        include: { doctor: true },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Conflict: Dr. ${duplicate.doctor.name} already has an appointment at ${appointmentTime} on this date.`,
        });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id, hospitalId },
      data: {
        ...(patientId && { patientId }),
        ...(doctorId && { doctorId }),
        ...(department && { department }),
        ...(aptDate && { appointmentDate: aptDate }),
        ...(appointmentTime && { appointmentTime: appointmentTime.trim() }),
        ...(reasonForVisit && { reasonForVisit: reasonForVisit.trim() }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes.trim() }),
      },
      include: { patient: true, doctor: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('updateAppointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const updated = await prisma.appointment.update({
      where: { id, hospitalId },
      data: { status: 'CANCELLED' },
    });
    return res.status(200).json({ success: true, message: 'Appointment cancelled successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};
