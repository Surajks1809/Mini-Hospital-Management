import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { Patient } from '../types';
import { request } from '../api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { PatientModal } from '../components/patients/PatientModal';
import { PatientProfileModal } from '../components/patients/PatientProfileModal';

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [bloodFilter, setBloodFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [profilePatientId, setProfilePatientId] = useState<string | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error } = useToast();

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
        gender: genderFilter,
        bloodGroup: bloodFilter,
        sortBy: 'registrationDate',
        sortOrder: 'desc',
      });

      const res = await request(`/patients?${queryParams.toString()}`);
      if (res.success && res.data) {
        setPatients(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch patients', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, genderFilter, bloodFilter]);

  // Handle global patient created event
  useEffect(() => {
    const handleGlobalPatientCreated = () => {
      fetchPatients();
    };
    window.addEventListener('patient:created', handleGlobalPatientCreated);
    return () => window.removeEventListener('patient:created', handleGlobalPatientCreated);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleDelete = async () => {
    if (!patientToDelete) return;
    setDeleteLoading(true);
    try {
      await request(`/patients/${patientToDelete.id}`, { method: 'DELETE' });
      success(`Patient ${patientToDelete.fullName} removed`, 'Deleted');
      setPatientToDelete(null);
      fetchPatients();
    } catch (err: any) {
      error(err.message || 'Failed to delete patient', 'Error');
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
            <Users className="w-7 h-7 text-blue-600" /> Patient Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage comprehensive clinical records, demographics, and registration history.
          </p>
        </div>

        <button
          onClick={() => {
            setPatientToEdit(null);
            setIsAddEditOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
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
            placeholder="Search by patient name, ID, phone, or email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Blood Group Filter */}
          <select
            value={bloodFilter}
            onChange={(e) => {
              setBloodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      {/* Patients Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Blood Group</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      Loading patient records...
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-base text-slate-800">No Patient Records in Database</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Hospital patient register is fresh and ready. Register your first patient with their medical history and contact details.
                    </div>
                    <button
                      onClick={() => {
                        setPatientToEdit(null);
                        setIsAddEditOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register First Patient</span>
                    </button>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-xs text-blue-600">
                      {p.patientId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.fullName}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{p.address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {p.age} yrs • <span className="capitalize">{p.gender.toLowerCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs font-mono">{p.phone}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="rose" size="sm">
                        {p.bloodGroup}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(p.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setProfilePatientId(p.id)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setPatientToEdit(p);
                          setIsAddEditOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Patient Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPatientToDelete(p)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Patient Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{patients.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> patients
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Registration / Edit Modal */}
      <PatientModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        patientToEdit={patientToEdit}
        onSaved={() => {
          setIsAddEditOpen(false);
          fetchPatients();
        }}
      />

      {/* Patient Profile View Modal */}
      <PatientProfileModal
        patientId={profilePatientId}
        onClose={() => setProfilePatientId(null)}
        onEdit={(p) => {
          setProfilePatientId(null);
          setPatientToEdit(p);
          setIsAddEditOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Confirm Patient Deletion"
        message={`Are you sure you want to permanently delete patient ${patientToDelete?.fullName} (${patientToDelete?.patientId})? This will also remove their appointments and invoices.`}
        confirmText="Delete Patient"
        variant="danger"
      />
    </div>
  );
};
