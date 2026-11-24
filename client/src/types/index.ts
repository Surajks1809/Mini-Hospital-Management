export interface Hospital {
  id: string;
  name: string;
  slug?: string;
  logo?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  emergencyContact?: string;
  website?: string;
  currency?: string;
  taxRate?: number;
  gstNumber?: string;
  invoicePrefix?: string;
  patientPrefix?: string;
}

export interface User {
  id: string;
  hospitalId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF';
  phone?: string;
  avatar?: string;
  hospital?: Hospital;
}

export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  age: number;
  phone: string;
  email?: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
  medicalHistory?: string;
  allergies?: string;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    invoices: number;
  };
  appointments?: Appointment[];
  invoices?: Invoice[];
}

export interface Doctor {
  id: string;
  doctorId: string;
  name: string;
  specialization: string;
  department: string;
  phone: string;
  email: string;
  consultationFee: number;
  availabilityStatus: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE' | 'EMERGENCY_ONLY';
  qualification: string;
  experienceYears: number;
  roomNumber: string;
  avatar?: string;
  _count?: {
    appointments: number;
  };
  appointments?: Appointment[];
}

export interface Appointment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    patientId: string;
    fullName: string;
    phone: string;
    gender: string;
    age: number;
  };
  doctor?: {
    id: string;
    doctorId: string;
    name: string;
    specialization: string;
    department: string;
    consultationFee: number;
  };
}

export interface InvoiceItem {
  id?: string;
  description: string;
  category: 'CONSULTATION' | 'MEDICINE' | 'LAB' | 'ROOM' | 'PROCEDURE' | 'OTHER';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string;
  receivedBy?: string;
  paidAt: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  consultationCharges: number;
  medicineCharges: number;
  laboratoryCharges: number;
  otherCharges: number;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'NET_BANKING';
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID';
  billingDate: string;
  notes?: string;
  doctorName?: string;
  createdAt: string;
  patient?: {
    id: string;
    patientId: string;
    fullName: string;
    phone: string;
    email?: string;
    address: string;
  };
  items: InvoiceItem[];
  payments: Payment[];
}

export interface HospitalSetting {
  id?: string;
  hospitalName: string;
  hospitalLogo?: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
  website: string;
  currency: string;
  taxRate: number;
  gstNumber: string;
  invoicePrefix?: string;
  patientPrefix?: string;
}

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  totalDoctors: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface DashboardData {
  stats: DashboardStats;
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number; billed: number }>;
    patientTrends: Array<{ day: string; date: string; patients: number }>;
  };
  recent: {
    patients: Patient[];
    appointments: Appointment[];
    invoices: Invoice[];
  };
}
