import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Clock,
  Printer,
  FileCheck,
} from 'lucide-react';
import { Invoice } from '../types';
import { request } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import { InvoiceViewModal } from '../components/billing/InvoiceViewModal';

export const Billing: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error } = useToast();
  const { settings } = useAuth();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: search.trim(),
        status: statusFilter,
      });

      const res = await request(`/invoices?${params.toString()}`);
      if (res.success && res.data) {
        setInvoices(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch invoices', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleteLoading(true);
    try {
      await request(`/invoices/${invoiceToDelete.id}`, { method: 'DELETE' });
      success(`Invoice ${invoiceToDelete.invoiceNumber} deleted`, 'Deleted');
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (err: any) {
      error(err.message || 'Failed to delete invoice', 'Error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-emerald-600" /> Billing & Payment Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated grand total calculations, printable tax invoices, and payment tracking.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New Invoice</span>
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
            placeholder="Search by invoice number or patient name..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Patient Details</th>
                <th className="py-3.5 px-4">Billing Date</th>
                <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3.5 px-4 text-right">Paid (₹)</th>
                <th className="py-3.5 px-4 text-right">Balance (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                      Loading hospital bills...
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 px-4">
                    <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <Receipt className="w-7 h-7" />
                    </div>
                    <div className="font-bold text-base text-slate-800">No Invoices Generated Yet</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Create itemized hospital invoices, calculate taxes, and print or download receipts as PDF.
                    </div>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Generate First Invoice</span>
                    </button>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-xs text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.patient?.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {inv.patient?.patientId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(inv.billingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold text-xs">
                      ₹{inv.amountPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs">
                      <span className={inv.balanceAmount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                        ₹{inv.balanceAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setViewInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                      <button
                        onClick={() => setInvoiceToDelete(inv)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Invoice"
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
            Showing <span className="font-semibold text-slate-800">{invoices.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> invoices
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

      {/* Invoice Generation Modal */}
      <InvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={() => {
          setIsCreateOpen(false);
          fetchInvoices();
        }}
      />

      {/* Printable Invoice & PDF Download Modal */}
      <InvoiceViewModal
        invoice={viewInvoice}
        settings={settings}
        onClose={() => setViewInvoice(null)}
        onPaymentUpdated={() => {
          fetchInvoices();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Hospital Invoice"
        message={`Are you sure you want to delete invoice #${invoiceToDelete?.invoiceNumber} for ${invoiceToDelete?.patient?.fullName}?`}
        confirmText="Delete Invoice"
        variant="danger"
      />
    </div>
  );
};
