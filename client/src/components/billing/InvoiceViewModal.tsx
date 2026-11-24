import React, { useRef, useState } from 'react';
import { X, Printer, Download, CheckCircle2, Clock, ShieldCheck, QrCode } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, HospitalSetting } from '../../types';
import { Badge } from '../common/Badge';
import { Logo } from '../common/Logo';
import { useToast } from '../../context/ToastContext';
import { request } from '../../api';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  settings: HospitalSetting | null;
  onClose: () => void;
  onPaymentUpdated: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  settings,
  onClose,
  onPaymentUpdated,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [showCollectForm, setShowCollectForm] = useState(false);

  const { success, error } = useToast();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`MediCare_Invoice_${invoice.invoiceNumber}.pdf`);
      success(`Invoice ${invoice.invoiceNumber} downloaded as PDF`, 'Download Complete');
    } catch (err: any) {
      console.error('PDF error:', err);
      error('Failed to generate PDF document', 'Error');
    } finally {
      setDownloading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      error('Please enter a valid payment amount', 'Invalid Amount');
      return;
    }

    setCollecting(true);
    try {
      await request(`/invoices/${invoice.id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          amountPaid: amt,
          paymentMethod: 'CASH',
          notes: 'Counter payment collection',
        }),
      });
      success(`Payment of ₹${amt.toLocaleString()} recorded`, 'Payment Received');
      setShowCollectForm(false);
      setCollectAmount('');
      onPaymentUpdated();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to record payment', 'Error');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Action Header (No print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              Tax Invoice #{invoice.invoiceNumber}
            </span>
            <Badge
              variant={
                invoice.paymentStatus === 'PAID'
                  ? 'green'
                  : invoice.paymentStatus === 'PARTIALLY_PAID'
                  ? 'amber'
                  : 'rose'
              }
              dot
            >
              {invoice.paymentStatus}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {invoice.paymentStatus !== 'PAID' && (
              <button
                onClick={() => setShowCollectForm(!showCollectForm)}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all"
              >
                Collect Payment
              </button>
            )}

            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-soft-sm border border-slate-200"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-70"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Payment Collection Form */}
        {showCollectForm && (
          <form
            onSubmit={handleRecordPayment}
            className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-4 no-print animate-in fade-in"
          >
            <div className="text-xs text-emerald-900">
              Remaining Balance: <span className="font-bold">₹{invoice.balanceAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={invoice.balanceAmount}
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                placeholder="Enter amount (₹)"
                className="px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none w-36 font-mono font-semibold"
              />
              <button
                type="submit"
                disabled={collecting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                {collecting ? 'Saving...' : 'Record Receipt'}
              </button>
            </div>
          </form>
        )}

        {/* Printable Invoice Container */}
        <div id="printable-invoice" ref={invoiceRef} className="p-8 sm:p-10 bg-white text-slate-800">
          {/* Top Section: Hospital Branding & Invoice Tag */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
            <div>
              <Logo size="lg" showText={true} />
              <p className="text-xs font-bold text-blue-900 mt-2">
                {settings?.hospitalName || 'MediCare Super Speciality Hospital'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-0.5 leading-tight">
                {settings?.address || 'Plot 42, Health City, Sector 18, Medical Enclave, New Delhi - 110001'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Phone: {settings?.phone || '+91 (011) 4567-8900'} • Email: {settings?.email || 'billing@medicarehms.org'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                GSTIN: {settings?.gstNumber || '07AAAAA0000A1Z5'}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                TAX INVOICE
              </div>
              <div className="font-mono text-xs font-bold text-blue-700 mt-1">
                #{invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Date:{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(invoice.billingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Payment Method:{' '}
                <span className="font-semibold text-slate-800">{invoice.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Patient Details & Clinical Meta */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billed To (Patient Information)
              </div>
              <div className="text-sm font-bold text-slate-900">{invoice.patient?.fullName}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                Patient ID: {invoice.patient?.patientId}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Phone: {invoice.patient?.phone}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-xs">
                Address: {invoice.patient?.address}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Attending Clinical Staff
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {invoice.doctorName || 'Senior Consultant'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Department: Outpatient Services (OPD)</div>
              <div className="mt-3 inline-block">
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${
                    invoice.paymentStatus === 'PAID'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : invoice.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  Status: {invoice.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Charges Table */}
          <div className="py-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Category</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price (₹)</th>
                  <th className="py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-slate-900">{it.description}</td>
                      <td className="py-2.5 text-center text-slate-500 text-[11px]">{it.category}</td>
                      <td className="py-2.5 text-center font-mono">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono">₹{it.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">₹{it.total.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    {invoice.consultationCharges > 0 && (
                      <tr>
                        <td className="py-2 font-medium">Specialist Doctor Consultation</td>
                        <td className="py-2 text-center text-[11px] text-slate-500">CONSULTATION</td>
                        <td className="py-2 text-center font-mono">1</td>
                        <td className="py-2 text-right font-mono">₹{invoice.consultationCharges.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-semibold">₹{invoice.consultationCharges.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.medicineCharges > 0 && (
                      <tr>
                        <td className="py-2 font-medium">Prescribed Pharmacy & Medications</td>
                        <td className="py-2 text-center text-[11px] text-slate-500">MEDICINE</td>
                        <td className="py-2 text-center font-mono">1</td>
                        <td className="py-2 text-right font-mono">₹{invoice.medicineCharges.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-semibold">₹{invoice.medicineCharges.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.laboratoryCharges > 0 && (
                      <tr>
                        <td className="py-2 font-medium">Diagnostic Pathology & Radiology Investigations</td>
                        <td className="py-2 text-center text-[11px] text-slate-500">LAB</td>
                        <td className="py-2 text-center font-mono">1</td>
                        <td className="py-2 text-right font-mono">₹{invoice.laboratoryCharges.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-semibold">₹{invoice.laboratoryCharges.toLocaleString()}</td>
                      </tr>
                    )}
                    {invoice.otherCharges > 0 && (
                      <tr>
                        <td className="py-2 font-medium">Procedural & Bio-Medical Support Charges</td>
                        <td className="py-2 text-center text-[11px] text-slate-500">OTHER</td>
                        <td className="py-2 text-center font-mono">1</td>
                        <td className="py-2 text-right font-mono">₹{invoice.otherCharges.toLocaleString()}</td>
                        <td className="py-2 text-right font-mono font-semibold">₹{invoice.otherCharges.toLocaleString()}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Calculations Breakdown */}
          <div className="flex justify-end pt-2 pb-6 border-t border-slate-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">₹{invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount:</span>
                  <span className="font-mono">- ₹{invoice.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST ({invoice.taxRate}%):</span>
                <span className="font-mono">+ ₹{invoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-blue-700">₹{invoice.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-700">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-600 font-semibold">₹{invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Balance Due:</span>
                <span className={`font-mono ${invoice.balanceAmount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  ₹{invoice.balanceAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer: Authorized Signatures & Terms */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 items-end">
            <div className="space-y-1 text-[10px] text-slate-400">
              <p className="font-semibold text-slate-600">Terms & Conditions:</p>
              <p>1. This is a computer-generated tax invoice and requires no physical seal.</p>
              <p>2. Medicines once dispensed cannot be returned or refunded.</p>
              <p>3. Keep this bill for insurance claim and reimbursement purposes.</p>
            </div>

            <div className="text-right">
              <div className="inline-block text-center border-t border-slate-400 pt-2 w-48">
                <div className="text-xs font-bold text-slate-800">Authorized Signature</div>
                <div className="text-[10px] text-slate-400">Accounts & Billing Officer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
