import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  IndianRupee,
  Activity,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { request, getAuthToken } from '../api';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { success, error } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await request(`/reports/summary?${params.toString()}`);
      if (res.success) {
        setSummary(res.summary);
        setDoctorStats(res.doctorStats || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch analytics', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportCsv = (type: string) => {
    const token = getAuthToken();
    const params = new URLSearchParams({ type });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    // Open direct download endpoint
    const url = `/api/reports/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `medicare_${type}_report.csv`);
    // Pass auth token via header using fetch blob or download trigger
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `medicare_${type}_report.csv`;
        link.click();
        success(`Exported ${type} dataset as CSV`, 'Download Complete');
      })
      .catch(() => error('Failed to export CSV', 'Error'));
  };

  const COLORS = ['#2563EB', '#0D9488', '#6366F1', '#EC4899', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Reports & Hospital Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical attendance, doctor workloads, and financial revenue audit with CSV exports.
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCsv('patients')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all shadow-soft-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Patients CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('revenue')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all shadow-soft-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Revenue CSV</span>
          </button>
          <button
            onClick={() => handleExportCsv('appointments')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all shadow-soft-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Appointments CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" /> Date Range Filter:
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-rose-600 font-semibold hover:underline"
          >
            Reset Dates
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered Patients
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary?.totalPatients || 0}</div>
          <div className="text-xs text-slate-500 mt-1">In selected timeframe</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Appointments Conducted
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.completedAppointments || 0}{' '}
            <span className="text-xs font-normal text-slate-400">/ {summary?.totalAppointments || 0}</span>
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Completed consultations</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gross Billed Amount
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{summary?.totalBilled?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Invoices issued</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Collected Revenue
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ₹{summary?.totalCollected?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Pending: ₹{summary?.totalPending?.toLocaleString() || 0}
          </div>
        </div>
      </div>

      {/* Doctor-wise Appointment Statistics Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Specialist Clinical Workload & Performance</h2>
          <span className="text-xs text-slate-500">Live aggregated metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4 text-center">Total Appointments</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Cancelled</th>
                <th className="py-3 px-4 text-right">Consultation Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {doctorStats.map((doc) => (
                <tr key={doc.doctorId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{doc.doctorName}</td>
                  <td className="py-3 px-4 text-slate-600">{doc.specialization}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{doc.totalAppointments}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{doc.completed}</td>
                  <td className="py-3 px-4 text-center text-rose-500">{doc.cancelled}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{doc.revenueGenerated.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
