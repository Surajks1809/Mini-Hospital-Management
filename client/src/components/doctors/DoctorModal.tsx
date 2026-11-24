import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Mail, Phone, IndianRupee, Building, Award, Clock } from 'lucide-react';
import { Doctor } from '../../types';
import { request } from '../../api';
import { useToast } from '../../context/ToastContext';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  doctorToEdit?: Doctor | null;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  doctorToEdit,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
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
  }>({
    name: '',
    specialization: '',
    department: 'General Medicine',
    phone: '',
    email: '',
    consultationFee: 500,
    availabilityStatus: 'AVAILABLE',
    qualification: 'MBBS, MD',
    experienceYears: 5,
    roomNumber: 'OPD-101',
  });

  const departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'General Surgery',
    'General Medicine',
    'Gynecology',
    'Dermatology',
    'Ophthalmology',
    'ENT',
  ];

  useEffect(() => {
    if (doctorToEdit) {
      setFormData({
        name: doctorToEdit.name,
        specialization: doctorToEdit.specialization,
        department: doctorToEdit.department,
        phone: doctorToEdit.phone,
        email: doctorToEdit.email,
        consultationFee: doctorToEdit.consultationFee,
        availabilityStatus: doctorToEdit.availabilityStatus,
        qualification: doctorToEdit.qualification,
        experienceYears: doctorToEdit.experienceYears,
        roomNumber: doctorToEdit.roomNumber,
      });
    } else {
      setFormData({
        name: '',
        specialization: '',
        department: 'General Medicine',
        phone: '',
        email: '',
        consultationFee: 500,
        availabilityStatus: 'AVAILABLE',
        qualification: 'MBBS, MD',
        experienceYears: 5,
        roomNumber: 'OPD-101',
      });
    }
  }, [doctorToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.specialization.trim() || !formData.phone.trim() || !formData.email.trim()) {
      error('Please complete all mandatory doctor details (*)', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      if (doctorToEdit) {
        await request(`/doctors/${doctorToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        success(`Doctor ${formData.name} updated successfully`, 'Updated');
      } else {
        await request('/doctors', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        success(`Doctor ${formData.name} added to hospital directory`, 'Added');
      }
      onSaved();
    } catch (err: any) {
      error(err.message || 'Failed to save doctor details', 'Error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-soft-xl border border-slate-100 my-8 transform animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {doctorToEdit ? `Edit Doctor: ${doctorToEdit.name}` : 'Add New Medical Specialist'}
              </h3>
              <p className="text-xs text-slate-500">
                {doctorToEdit ? `ID: ${doctorToEdit.doctorId}` : 'ID will be automatically generated.'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Doctor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Specialization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Chief Cardiologist"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98234 11001"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@medicarehms.org"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Fee (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Availability Status
              </label>
              <select
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_CONSULTATION">In Consultation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="EMERGENCY_ONLY">Emergency Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Degrees & Qualification
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="MBBS, MD, DM"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                OPD Room Number
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="OPD-201"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : doctorToEdit ? (
                'Save Changes'
              ) : (
                'Add Doctor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
