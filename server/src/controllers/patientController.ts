import { Response } from 'express';
import prisma from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

// Auto-generate Patient ID scoped to this specific hospital
export const generateNextPatientId = async (hospitalId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `MED-P-${currentYear}-`;
  
  const lastPatient = await prisma.patient.findFirst({
    where: {
      hospitalId,
      patientId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      patientId: 'desc',
    },
  });

  if (!lastPatient) {
    return `${prefix}001`;
  }

  const parts = lastPatient.patientId.split('-');
  const lastNum = parseInt(parts[parts.length - 1], 10);
  const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};

export const getPatients = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const gender = req.query.gender as string;
    const bloodGroup = req.query.bloodGroup as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId, // Tenant isolation
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { patientId: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (gender && gender !== 'ALL') {
      where.gender = gender;
    }

    if (bloodGroup && bloodGroup !== 'ALL') {
      where.bloodGroup = bloodGroup;
    }

    if (startDate || endDate) {
      where.registrationDate = {};
      if (startDate) {
        where.registrationDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.registrationDate.lte = end;
      }
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { appointments: true, invoices: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('getPatients error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patients' });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const patient = await prisma.patient.findFirst({
      where: {
        hospitalId, // Tenant isolation
        OR: [{ id }, { patientId: id }],
      },
      include: {
        appointments: {
          include: { doctor: true },
          orderBy: { appointmentDate: 'desc' },
        },
        invoices: {
          include: { items: true, payments: true },
          orderBy: { billingDate: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({ success: true, data: patient });
  } catch (error: any) {
    console.error('getPatientById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve patient details' });
  }
};

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
      registrationDate,
    } = req.body;

    if (!fullName || !gender || !dateOfBirth || !phone || !address || !bloodGroup || !emergencyContact) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields. Please fill in all mandatory patient details.',
      });
    }

    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 0) age = 0;

    const patientId = await generateNextPatientId(hospitalId);

    const newPatient = await prisma.patient.create({
      data: {
        hospitalId, // Tenant isolation
        patientId,
        fullName: fullName.trim(),
        gender,
        dateOfBirth: dob,
        age,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address.trim(),
        bloodGroup,
        emergencyContact: emergencyContact.trim(),
        medicalHistory: medicalHistory?.trim() || 'No significant past history recorded.',
        allergies: allergies?.trim() || 'No known drug allergies.',
        registrationDate: registrationDate ? new Date(registrationDate) : new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: newPatient,
    });
  } catch (error: any) {
    console.error('createPatient error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create patient record' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const {
      fullName,
      gender,
      dateOfBirth,
      phone,
      email,
      address,
      bloodGroup,
      emergencyContact,
      medicalHistory,
      allergies,
    } = req.body;

    let age: number | undefined = undefined;
    let dob: Date | undefined = undefined;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 0) age = 0;
    }

    const updated = await prisma.patient.update({
      where: {
        id,
        hospitalId, // Enforce tenant boundary
      },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(gender && { gender }),
        ...(dob && { dateOfBirth: dob }),
        ...(age !== undefined && { age }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(address && { address: address.trim() }),
        ...(bloodGroup && { bloodGroup }),
        ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
        ...(medicalHistory !== undefined && { medicalHistory: medicalHistory.trim() }),
        ...(allergies !== undefined && { allergies: allergies.trim() }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Patient information updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('updatePatient error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update patient record' });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    await prisma.patient.delete({
      where: { id, hospitalId },
    });
    return res.status(200).json({ success: true, message: 'Patient record deleted successfully' });
  } catch (error: any) {
    console.error('deletePatient error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete patient record' });
  }
};
