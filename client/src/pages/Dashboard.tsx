import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Stethoscope,
  IndianRupee,
  Clock,
  ArrowUpRight,
  UserPlus,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardData } from '../types';
import { request } from '../api';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await request('/dashboard');
      if (res.success && res.stats) {
        setData(res as any);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          Loading MediCare clinical dashboard...
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalPatients: 0,
    todayAppointments: 0,
    totalDoctors: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-blue-800 to-navy text-white p-6 sm:p-7 rounded-3xl shadow-soft-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide text-blue-200 mb-2 border border-white/10">
            <Activity className="w-3.5 h-3.5 text-teal-300" /> Operational Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MediCare Executive Dashboard
          </h1>
          <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
            Real-time telemetry on inpatient/outpatient admissions, scheduled consultations, and hospital billing revenue.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/15 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-blue-300" />
            <span>Add Patient</span>
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/15 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-teal-300" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold transition-all shadow-md"
          >
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* 5 Real-Time Connected Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Patients
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalPatients}</div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Live database count</span>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Appointments
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.todayAppointments}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1.5">Scheduled for today</div>
        </div>

        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Doctors
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</div>
          <div className="text-[11px] text-teal-600 font-medium mt-1.5">Across 5 OPD Specialties</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1.5">Collected payments</div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Bills
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{stats.pendingPayments.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1.5">Unsettled balances</div>
        </div>
      </div>

      {/* Interactive Charts: Monthly Revenue & Patient Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Revenue & Collections</h2>
              <p className="text-xs text-slate-500 mt-0.5">Billed vs Actual Realized Collections (₹)</p>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              Fiscal 2026
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Registrations Trends Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Patient Registrations Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">New patient registrations (Last 7 Days)</p>
            </div>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              Weekly Flow
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.patientTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Patients`, 'Registrations']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="patients" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Data Sections: Upcoming Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Upcoming Consultations
            </h2>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.recent.appointments || data.recent.appointments.length === 0) ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Consultations Scheduled</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  There are no appointments on record. Book an appointment with an attending doctor to start.
                </p>
                <button
                  onClick={() => navigate('/appointments')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Consultation</span>
                </button>
              </div>
            ) : (
              data.recent.appointments.map((apt) => (
                <div key={apt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{apt.patient?.fullName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      with {apt.doctor?.name} ({apt.doctor?.department})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">{apt.appointmentTime}</div>
                    <div className="text-[11px] text-slate-400">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Patient Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" /> Recent Patient Registrations
            </h2>
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(!data?.recent.patients || data.recent.patients.length === 0) ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Patients Registered Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  The hospital directory is fresh and ready. Register your first patient to begin tracking records.
                </p>
                <button
                  onClick={() => navigate('/patients')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register First Patient</span>
                </button>
              </div>
            ) : (
              data.recent.patients.map((pat) => (
                <div key={pat.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {pat.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{pat.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">{pat.patientId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="rose" size="sm">
                      {pat.bloodGroup}
                    </Badge>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(pat.registrationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
