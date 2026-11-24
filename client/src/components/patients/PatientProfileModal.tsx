import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Receipt,
  Clock,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Patient } from '../../types';
import { request } from '../../api';
import { Badge } from '../common/Badge';

interface PatientProfileModalProps {
  patientId: string | null;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  patientId,
  onClose,
  onEdit,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments' | 'billing'>('profile');

  useEffect(() => {
    if (!patientId) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await request(`/patients/${patientId}`);
        if (res.success && res.data) {
          setPatient(res.data);
        }
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-soft-xl border border-slate-100 my-8 transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              {patient?.fullName ? patient.fullName.slice(0, 2).toUpperCase() : 'PT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{patient?.fullName}</h3>
                <Badge variant="blue" size="sm">
                  {patient?.patientId}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>{patient?.gender}</span>
                <span>•</span>
                <span>{patient?.age} Years Old</span>
                <span>•</span>
                <span className="font-semibold text-rose-600">Blood: {patient?.bloodGroup}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patient && (
              <button
                onClick={() => onEdit(patient)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 my-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Clinical & Contact Profile
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Appointments
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {patient?.appointments?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'billing'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Billing History
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {patient?.invoices?.length || 0}
            </span>
          </button>
        </div>

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Contact Information
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>{patient?.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>{patient?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{patient?.address}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Emergency Contact
                </div>
                <div className="text-sm font-semibold text-slate-900">{patient?.emergencyContact}</div>
                <div className="text-xs text-slate-500">
                  Registered On:{' '}
                  {patient?.registrationDate
                    ? new Date(patient.registrationDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '-'}
                </div>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Allergies & Drug Warnings
                </div>
                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                  {patient?.allergies || 'No known allergies reported.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                  <Heart className="w-4 h-4 text-blue-600" /> Clinical History & Chronic Conditions
                </div>
                <p className="text-sm text-blue-900 leading-relaxed">
                  {patient?.medicalHistory || 'No significant history recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'appointments' && (
          <div className="space-y-3 pt-2">
            {!patient?.appointments || patient.appointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No appointment records found for this patient.
              </div>
            ) : (
              patient.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {apt.doctor?.name} ({apt.department})
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime} • Reason:{' '}
                      {apt.reasonForVisit}
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === 'COMPLETED' ? 'green' : apt.status === 'SCHEDULED' ? 'blue' : 'rose'
                    }
                    dot
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Billing History */}
        {activeTab === 'billing' && (
          <div className="space-y-3 pt-2">
            {!patient?.invoices || patient.invoices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No billing invoices generated for this patient.
              </div>
            ) : (
              patient.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Invoice #{inv.invoiceNumber} • ₹{inv.grandTotal.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Billed on {new Date(inv.billingDate).toLocaleDateString()} • Paid: ₹
                      {inv.amountPaid.toLocaleString()} • Bal: ₹{inv.balanceAmount.toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    variant={
                      inv.paymentStatus === 'PAID'
                        ? 'green'
                        : inv.paymentStatus === 'PARTIALLY_PAID'
                        ? 'amber'
                        : 'rose'
                    }
                    dot
                  >
                    {inv.paymentStatus}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
