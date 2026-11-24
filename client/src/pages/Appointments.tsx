import React, { useState, useEffect } from 'react';
import {
  Calendar,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';
import { Appointment, Doctor } from '../types';
import { request } from '../api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { AppointmentModal } from '../components/appointments/AppointmentModal';

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { success, error } = useToast();

  const fetchDoctors = async () => {
    try {
      const res = await request('/doctors');
      if (res.success && res.data) setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
        doctorId: doctorFilter,
        status: statusFilter,
      });

      if (tabFilter !== 'all') {
        params.append('filter', tabFilter);
      }

      const res = await request(`/appointments?${params.toString()}`);
      if (res.success && res.data) {
        setAppointments(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch appointments', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [page, tabFilter, doctorFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  const handleStatusChange = async (apt: Appointment, newStatus: 'COMPLETED' | 'CANCELLED') => {
    try {
      if (newStatus === 'CANCELLED') {
        await request(`/appointments/${apt.id}/cancel`, { method: 'PATCH' });
        success('Appointment cancelled', 'Cancelled');
      } else {
        await request(`/appointments/${apt.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'COMPLETED' }),
        });
        success('Appointment marked as Completed', 'Completed');
      }
      fetchAppointments();
    } catch (err: any) {
      error(err.message || 'Failed to update status', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600" /> Appointment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Schedule OPD visits, avoid doctor slot conflicts, and manage consultation workflow.
          </p>
        </div>

        <button
          onClick={() => {
            setAppointmentToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Tabs Filter (All, Today, Upcoming) */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setTabFilter('all');
            setPage(1);
          }}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            tabFilter === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Appointments
        </button>
        <button
          onClick={() => {
            setTabFilter('today');
            setPage(1);
          }}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            tabFilter === 'today'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Today's Appointments
        </button>
        <button
          onClick={() => {
            setTabFilter('upcoming');
            setPage(1);
          }}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            tabFilter === 'upcoming'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Upcoming Appointments
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, patient, doctor, or symptom..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => {
              setDoctorFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3.5 px-4">Appointment ID</th>
                <th className="py-3.5 px-4">Patient Details</th>
                <th className="py-3.5 px-4">Doctor & Speciality</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Reason for Visit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      Loading appointments...
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-base text-slate-800">No Appointments Scheduled</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Schedule patient OPD visits and consultations with attending doctors without scheduling conflicts.
                    </div>
                    <button
                      onClick={() => {
                        setAppointmentToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Book Consultation</span>
                    </button>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-xs text-indigo-600">
                      {a.appointmentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{a.patient?.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {a.patient?.patientId} • {a.patient?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{a.doctor?.name}</div>
                      <div className="text-xs text-slate-400">{a.department}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {a.appointmentTime}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(a.appointmentDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {a.reasonForVisit}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          a.status === 'COMPLETED'
                            ? 'green'
                            : a.status === 'SCHEDULED'
                            ? 'blue'
                            : 'rose'
                        }
                        dot
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {a.status === 'SCHEDULED' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(a, 'COMPLETED')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCancelModalApt(a)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setAppointmentToEdit(a);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Appointment"
                      >
                        <Edit2 className="w-4 h-4" />
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
            Showing <span className="font-semibold text-slate-800">{appointments.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> appointments
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

      {/* Appointment Edit/Create Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointmentToEdit={appointmentToEdit}
        onSaved={() => {
          setIsModalOpen(false);
          fetchAppointments();
        }}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        onConfirm={async () => {
          if (cancelModalApt) {
            await handleStatusChange(cancelModalApt, 'CANCELLED');
            setCancelModalApt(null);
          }
        }}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment ${cancelModalApt?.appointmentId} for ${cancelModalApt?.patient?.fullName}?`}
        confirmText="Cancel Appointment"
        variant="warning"
      />
    </div>
  );
};
