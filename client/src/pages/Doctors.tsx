import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  PlusCircle,
  Search,
  Phone,
  Mail,
  IndianRupee,
  Calendar,
  Edit2,
  Trash2,
  Building,
  UserCheck,
} from 'lucide-react';
import { Doctor } from '../types';
import { request } from '../api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { DoctorModal } from '../components/doctors/DoctorModal';

export const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error } = useToast();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: search.trim(),
        department: departmentFilter,
      });
      const res = await request(`/doctors?${params.toString()}`);
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch doctors', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleDelete = async () => {
    if (!doctorToDelete) return;
    setDeleteLoading(true);
    try {
      await request(`/doctors/${doctorToDelete.id}`, { method: 'DELETE' });
      success(`Dr. ${doctorToDelete.name} removed from registry`, 'Deleted');
      setDoctorToDelete(null);
      fetchDoctors();
    } catch (err: any) {
      error(err.message || 'Failed to delete doctor', 'Error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-teal-600" /> Doctors & Medical Specialists
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of clinical staff, consultation schedules, and department allocations.
          </p>
        </div>

        <button
          onClick={() => {
            setDoctorToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-teal-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Specialist</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor by name, specialty, or department..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="General Surgery">General Surgery</option>
            <option value="General Medicine">General Medicine</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
            Loading doctors...
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Doctors Registered Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The medical staff directory is fresh. Add your clinical specialists, consultants, and surgeons with their departments and consultation fees.
          </p>
          <button
            onClick={() => {
              setDoctorToEdit(null);
              setIsModalOpen(true);
            }}
            className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-teal-500/20 text-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add First Doctor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 font-bold text-lg flex items-center justify-center border border-teal-100 flex-shrink-0">
                      {doc.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                      <p className="text-xs font-medium text-teal-700">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{doc.doctorId}</p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      doc.availabilityStatus === 'AVAILABLE'
                        ? 'green'
                        : doc.availabilityStatus === 'IN_CONSULTATION'
                        ? 'blue'
                        : doc.availabilityStatus === 'ON_LEAVE'
                        ? 'rose'
                        : 'amber'
                    }
                    dot
                  >
                    {doc.availabilityStatus.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-800">{doc.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">OPD Room:</span>
                    <span className="font-medium text-slate-700">{doc.roomNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-emerald-700">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Consultations:</span>
                    <span className="font-semibold text-slate-800">{doc._count?.appointments || 0}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setDoctorToEdit(doc);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDoctorToDelete(doc)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Remove Doctor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      <DoctorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctorToEdit={doctorToEdit}
        onSaved={() => {
          setIsModalOpen(false);
          fetchDoctors();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!doctorToDelete}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Remove Doctor"
        message={`Are you sure you want to remove Dr. ${doctorToDelete?.name} (${doctorToDelete?.doctorId}) from the hospital directory?`}
        confirmText="Remove Doctor"
        variant="danger"
      />
    </div>
  );
};
