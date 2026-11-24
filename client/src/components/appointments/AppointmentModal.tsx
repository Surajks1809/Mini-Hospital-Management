import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, AlertCircle } from 'lucide-react';
import { Appointment, Doctor, Patient } from '../../types';
import { request } from '../../api';
import { useToast } from '../../context/ToastContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  appointmentToEdit?: Appointment | null;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  appointmentToEdit,
}) => {
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    department: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    reasonForVisit: '',
    status: 'SCHEDULED' as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
    notes: '',
  });

  // Time slots for OPD
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          request('/patients?limit=100'),
          request('/doctors'),
        ]);
        if (patRes.success && patRes.data) setPatients(patRes.data);
        if (docRes.success && docRes.data) setDoctors(docRes.data);
      } catch (err) {
        console.error('Error fetching modal options:', err);
      }
    };

    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (appointmentToEdit) {
      setFormData({
        patientId: appointmentToEdit.patientId,
        doctorId: appointmentToEdit.doctorId,
        department: appointmentToEdit.department,
        appointmentDate: appointmentToEdit.appointmentDate.split('T')[0],
        appointmentTime: appointmentToEdit.appointmentTime,
        reasonForVisit: appointmentToEdit.reasonForVisit,
        status: appointmentToEdit.status,
        notes: appointmentToEdit.notes || '',
      });
    } else {
      setFormData({
        patientId: '',
        doctorId: '',
        department: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        reasonForVisit: '',
        status: 'SCHEDULED',
        notes: '',
      });
    }
  }, [appointmentToEdit, isOpen]);

  // When doctor is selected, auto-set department
  const handleDoctorChange = (docId: string) => {
    const selected = doctors.find((d) => d.id === docId);
    setFormData((prev) => ({
      ...prev,
      doctorId: docId,
      department: selected?.department || prev.department,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.reasonForVisit.trim()) {
      error('Please complete all mandatory appointment fields (*)', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      if (appointmentToEdit) {
        await request(`/appointments/${appointmentToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        success('Appointment schedule updated', 'Updated');
      } else {
        await request('/appointments', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        success('New consultation appointment scheduled', 'Booked');
      }
      onSaved();
    } catch (err: any) {
      error(err.message || 'Failed to schedule appointment', 'Scheduling Conflict');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-soft-xl border border-slate-100 my-8 transform animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {appointmentToEdit ? 'Modify Appointment' : 'Schedule New Appointment'}
              </h3>
              <p className="text-xs text-slate-500">
                Automatic duplicate conflict prevention enabled.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {doctors.length === 0 && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No Doctors Registered:</span> Please add at least one doctor in the{' '}
                <span className="font-semibold underline">Doctors module</span> before booking an appointment.
              </div>
            </div>
          )}

          {patients.length === 0 && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No Patients Registered:</span> Please add a patient in the{' '}
                <span className="font-semibold underline">Patients module</span> before booking an appointment.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Patient <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.patientId}) - {p.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Attending Doctor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                readOnly
                value={formData.department || 'Select doctor to auto-fill'}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Appointment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Time Slot <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>
                    {ts}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Visit / Clinical Symptoms <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.reasonForVisit}
              onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
              placeholder="e.g. Chest discomfort, post-operative checkup, persistent fever..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {appointmentToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Notes / Pre-visit Preparation
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Fasting required, bring previous radiology scans..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Schedule...
                </>
              ) : appointmentToEdit ? (
                'Save Changes'
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
