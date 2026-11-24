import React, { useState, useEffect } from 'react';
import { X, Receipt, Plus, Trash2, IndianRupee, User, Calculator } from 'lucide-react';
import { Patient } from '../../types';
import { request } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { success, error } = useToast();
  const { settings } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  const defaultTaxRate = settings?.taxRate ?? 5.0;

  const [formData, setFormData] = useState({
    patientId: '',
    doctorName: '',
    consultationCharges: 800,
    medicineCharges: 500,
    laboratoryCharges: 1000,
    otherCharges: 200,
    discount: 0,
    taxRate: defaultTaxRate,
    paymentMethod: 'UPI' as const,
    paymentStatus: 'PAID' as const,
    amountPaid: 0,
    billingDate: new Date().toISOString().split('T')[0],
    notes: 'Outpatient consultation & diagnostics package',
    items: [
      { description: 'Specialist Doctor Consultation', category: 'CONSULTATION', quantity: 1, unitPrice: 800 },
      { description: 'Prescription Pharmaceuticals', category: 'MEDICINE', quantity: 1, unitPrice: 500 },
      { description: 'Diagnostic Blood Chemistry & Lab Tests', category: 'LAB', quantity: 1, unitPrice: 1000 },
      { description: 'Medical Consumables & Administration', category: 'OTHER', quantity: 1, unitPrice: 200 },
    ],
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await request('/patients?limit=100');
        if (res.success && res.data) setPatients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  // Dynamic calculations
  const subtotal =
    (parseFloat(formData.consultationCharges as any) || 0) +
    (parseFloat(formData.medicineCharges as any) || 0) +
    (parseFloat(formData.laboratoryCharges as any) || 0) +
    (parseFloat(formData.otherCharges as any) || 0);

  const discount = parseFloat(formData.discount as any) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = (taxable * (parseFloat(formData.taxRate as any) || 0)) / 100;
  const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

  // Auto initialize amountPaid to grandTotal if status is PAID
  useEffect(() => {
    if (formData.paymentStatus === 'PAID') {
      setFormData((prev) => ({ ...prev, amountPaid: grandTotal }));
    } else if (formData.paymentStatus === 'PENDING') {
      setFormData((prev) => ({ ...prev, amountPaid: 0 }));
    }
  }, [formData.paymentStatus, grandTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      error('Please select a patient for this bill', 'Validation Error');
      return;
    }

    setLoading(true);
    try {
      await request('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          subtotal,
          taxAmount,
          grandTotal,
        }),
      });
      success('Hospital invoice generated successfully', 'Invoice Created');
      onSaved();
    } catch (err: any) {
      error(err.message || 'Failed to create invoice', 'Error');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Generate Hospital Invoice</h3>
              <p className="text-xs text-slate-500">
                Itemized hospital charges, dynamic tax calculations and receipt logging.
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
          {patients.length === 0 && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
              <User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">No Patients Registered:</span> Please register at least one patient in the{' '}
                <span className="font-semibold underline">Patients module</span> before generating a billing invoice.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select Patient <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Attending Doctor
              </label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Date
              </label>
              <input
                type="date"
                required
                value={formData.billingDate}
                onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="INSURANCE">Health Insurance</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Itemized Charges Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-600" /> Itemized Hospital Charges (₹)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Consultation
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.consultationCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, consultationCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Medicine / Pharmacy
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.medicineCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Laboratory / Diagnostic
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.laboratoryCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, laboratoryCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Other / Procedural
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.otherCharges}
                  onChange={(e) =>
                    setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentStatus: e.target.value as any })
                  }
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-700"
                >
                  <option value="PAID">Full Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">- ₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Tax ({formData.taxRate}%):</span>
                <span className="font-mono">+ ₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-700">₹{grandTotal.toLocaleString()}</span>
              </div>
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
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                'Generate & Issue Invoice'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
