import bcrypt from 'bcryptjs';
import prisma from './db.js';

export async function resetFreshDatabase() {
  console.log('🧹 Clearing and initializing MediCare HMS multi-tenant database...');

  // 1. Delete all transactional, patient, and doctor records
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hospital.deleteMany();

  // 2. Create Default Master Hospital
  const masterHospital = await prisma.hospital.create({
    data: {
      name: 'MediCare Super Speciality Hospital',
      tagline: 'Excellence in Healthcare, Compassion in Healing',
      address: 'Plot 42, Health City, Sector 18, Medical Enclave, New Delhi - 110001',
      phone: '+91 (011) 4567-8900',
      email: 'support@medicarehms.org',
      emergencyContact: '+91 98765 43210',
      website: 'www.medicarehms.org',
      currency: '₹',
      taxRate: 5.0,
      gstNumber: '07AAAAA0000A1Z5',
      invoicePrefix: 'INV-2026-',
      patientPrefix: 'MED-P-2026-',
    },
  });

  // 3. Create Master Admin Account
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  await prisma.user.create({
    data: {
      hospitalId: masterHospital.id,
      name: 'Dr. Alok Verma',
      email: 'admin@medicare.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+91 98112 34567',
    },
  });

  console.log('✅ Master Administrator and Hospital initialized.');
  console.log('✨ System is 100% fresh and clean: 0 fake doctors, 0 fake patients, 0 fake appointments, 0 fake invoices.');
}

export const seedDatabase = resetFreshDatabase;
