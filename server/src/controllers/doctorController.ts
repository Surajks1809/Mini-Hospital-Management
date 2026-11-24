import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const generateNextDoctorId = async (hospitalId: string): Promise<string> => {
  const lastDoc = await prisma.doctor.findFirst({
    where: { hospitalId, doctorId: { startsWith: 'DOC-' } },
    orderBy: { doctorId: 'desc' },
  });

  if (!lastDoc) return 'DOC-101';
  const parts = lastDoc.doctorId.split('-');
  const num = parseInt(parts[1], 10);
  const next = isNaN(num) ? 101 : num + 1;
  return `DOC-${next}`;
};

export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const search = (req.query.search as string) || '';
    const department = req.query.department as string;
    const status = req.query.status as string;

    const where: any = {
      hospitalId, // Tenant isolation
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { specialization: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { doctorId: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }
    if (department && department !== 'ALL') {
      where.department = department;
    }
    if (status && status !== 'ALL') {
      where.availabilityStatus = status;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: doctors });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctors list' });
  }
};

export const getDoctorById = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const doctor = await prisma.doctor.findFirst({
      where: {
        hospitalId,
        OR: [{ id }, { doctorId: id }],
      },
      include: {
        appointments: {
          include: { patient: true },
          orderBy: { appointmentDate: 'desc' },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve doctor details' });
  }
};

export const createDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      name,
      specialization,
      department,
      phone,
      email,
      consultationFee,
      availabilityStatus,
      qualification,
      experienceYears,
      roomNumber,
    } = req.body;

    if (!name || !specialization || !department || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Missing mandatory doctor information' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.doctor.findFirst({
      where: { hospitalId, email: cleanEmail },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A doctor with this email already exists in your hospital' });
    }

    const doctorId = await generateNextDoctorId(hospitalId);

    const doctor = await prisma.doctor.create({
      data: {
        hospitalId, // Tenant isolation
        doctorId,
        name: name.trim(),
        specialization: specialization.trim(),
        department: department.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
        availabilityStatus: availabilityStatus || 'AVAILABLE',
        qualification: qualification?.trim() || 'MBBS, MD',
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 5,
        roomNumber: roomNumber?.trim() || 'OPD-101',
      },
    });

    return res.status(201).json({ success: true, message: 'Doctor added successfully', data: doctor });
  } catch (error: any) {
    console.error('createDoctor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create doctor record' });
  }
};

export const updateDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const {
      name,
      specialization,
      department,
      phone,
      email,
      consultationFee,
      availabilityStatus,
      qualification,
      experienceYears,
      roomNumber,
    } = req.body;

    const updated = await prisma.doctor.update({
      where: { id, hospitalId },
      data: {
        ...(name && { name: name.trim() }),
        ...(specialization && { specialization: specialization.trim() }),
        ...(department && { department: department.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(consultationFee !== undefined && { consultationFee: parseFloat(consultationFee) }),
        ...(availabilityStatus && { availabilityStatus }),
        ...(qualification && { qualification: qualification.trim() }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears, 10) }),
        ...(roomNumber && { roomNumber: roomNumber.trim() }),
      },
    });

    return res.status(200).json({ success: true, message: 'Doctor details updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update doctor record' });
  }
};

export const deleteDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    await prisma.doctor.delete({
      where: { id, hospitalId },
    });
    return res.status(200).json({ success: true, message: 'Doctor record deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete doctor' });
  }
};
