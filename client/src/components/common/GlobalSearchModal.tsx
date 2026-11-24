import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Calendar, Stethoscope, FileText, X, ArrowRight, Loader2 } from 'lucide-react';
import { request } from '../../api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    patients: any[];
    doctors: any[];
    appointments: any[];
    invoices: any[];
  }>({ patients: [], doctors: [], appointments: [], invoices: [] });

  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ patients: [], doctors: [], appointments: [], invoices: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [patRes, docRes, aptRes, invRes] = await Promise.all([
          request(`/patients?search=${encodeURIComponent(query)}&limit=4`),
          request(`/doctors?search=${encodeURIComponent(query)}`),
          request(`/appointments?search=${encodeURIComponent(query)}&limit=4`),
          request(`/invoices?search=${encodeURIComponent(query)}&limit=4`),
        ]);

        setResults({
          patients: patRes.data || [],
          doctors: docRes.data || [],
          appointments: aptRes.data || [],
          invoices: invRes.data || [],
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent listener
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults =
    results.patients.length + results.doctors.length + results.appointments.length + results.invoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-soft-xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients by name/ID, doctors, appointments, invoices..."
            className="flex-1 text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-10 text-slate-400 text-sm">
              <p>Type to search across the entire MediCare hospital database.</p>
              <p className="text-xs text-slate-400 mt-1">Try "Aarav", "Cardiology", "INV-2026", or "DOC-101"</p>
            </div>
          )}

          {query.trim().length >= 2 && !loading && totalResults === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              No matching records found for "{query}".
            </div>
          )}

          {/* Patients Section */}
          {results.patients.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Patients ({results.patients.length})
              </div>
              <div className="space-y-1">
                {results.patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate('/patients');
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {p.fullName} <span className="text-xs font-normal text-slate-400">({p.patientId})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.gender} • {p.age} yrs • Blood: {p.bloodGroup} • Phone: {p.phone}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Section */}
          {results.doctors.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Doctors ({results.doctors.length})
              </div>
              <div className="space-y-1">
                {results.doctors.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      onClose();
                      navigate('/doctors');
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                        {d.name} <span className="text-xs font-normal text-slate-400">({d.doctorId})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {d.specialization} • Dept: {d.department} • Room: {d.roomNumber}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments Section */}
          {results.appointments.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Appointments ({results.appointments.length})
              </div>
              <div className="space-y-1">
                {results.appointments.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onClose();
                      navigate('/appointments');
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {a.patient?.fullName} with {a.doctor?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(a.appointmentDate).toLocaleDateString()} at {a.appointmentTime} • Status: {a.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Section */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" /> Billing & Invoices ({results.invoices.length})
              </div>
              <div className="space-y-1">
                {results.invoices.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => {
                      onClose();
                      navigate('/billing');
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Invoice #{i.invoiceNumber} • {i.patient?.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        Total: ₹{i.grandTotal.toLocaleString()} • Status: {i.paymentStatus} • Date:{' '}
                        {new Date(i.billingDate).toLocaleDateString()}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
