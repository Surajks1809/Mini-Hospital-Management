import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Hospital,
  Shield,
  Key,
  Database,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { request } from '../api';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Settings: React.FC = () => {
  const { user, settings, refreshSettings, updateUser } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'hospital' | 'admin' | 'database'>('hospital');

  // Hospital settings state
  const [hospitalForm, setHospitalForm] = useState({
    hospitalName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
    website: '',
    currency: '₹',
    taxRate: 5.0,
    gstNumber: '',
  });

  // Admin Profile state
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset Demo modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingHospital, setSavingHospital] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (settings) {
      setHospitalForm({
        hospitalName: settings.hospitalName || '',
        tagline: settings.tagline || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        emergencyContact: settings.emergencyContact || '',
        website: settings.website || '',
        currency: settings.currency || '₹',
        taxRate: settings.taxRate ?? 5.0,
        gstNumber: settings.gstNumber || '',
      });
    }
    if (user) {
      setAdminName(user.name || '');
      setAdminPhone(user.phone || '');
    }
  }, [settings, user]);

  const handleHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHospital(true);
    try {
      await request('/settings', {
        method: 'PUT',
        body: JSON.stringify(hospitalForm),
      });
      success('Hospital institutional details updated', 'Settings Saved');
      refreshSettings();
    } catch (err: any) {
      error(err.message || 'Failed to update settings', 'Error');
    } finally {
      setSavingHospital(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: adminName, phone: adminPhone }),
      });
      if (res.success && res.user) {
        updateUser(res.user);
        success('Administrator profile details updated', 'Profile Saved');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update profile', 'Error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match', 'Mismatch');
      return;
    }
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters', 'Too Short');
      return;
    }

    setSavingPassword(true);
    try {
      await request('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      success('Security password successfully updated', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password', 'Error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      await request('/settings/reset-demo', { method: 'POST' });
      success('Demo data restored: 15 patients, 5 doctors, 10 appointments, 10 invoices.', 'Demo Reset Complete');
      setResetModalOpen(false);
      refreshSettings();
      // Notify other tabs/views
      window.dispatchEvent(new Event('patient:created'));
    } catch (err: any) {
      error(err.message || 'Failed to reset demo data', 'Error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-slate-700" /> System & Hospital Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure hospital identity, billing currency & tax parameters, admin credentials, and database backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('hospital')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'hospital'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hospital className="w-4 h-4" /> Hospital Profile & Tax
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'admin'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" /> Admin Profile & Security
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'database'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> Demo Data Management
        </button>
      </div>

      {/* Tab 1: Hospital Profile */}
      {activeTab === 'hospital' && (
        <form onSubmit={handleHospitalSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Registered Name
              </label>
              <input
                type="text"
                required
                value={hospitalForm.hospitalName}
                onChange={(e) => setHospitalForm({ ...hospitalForm, hospitalName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hospital Tagline / Motto
              </label>
              <input
                type="text"
                value={hospitalForm.tagline}
                onChange={(e) => setHospitalForm({ ...hospitalForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Physical Address (Shown on Invoices)
              </label>
              <input
                type="text"
                required
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={hospitalForm.phone}
                onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={hospitalForm.email}
                onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Emergency 24x7 Helpline
              </label>
              <input
                type="text"
                value={hospitalForm.emergencyContact}
                onChange={(e) => setHospitalForm({ ...hospitalForm, emergencyContact: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={hospitalForm.website}
                onChange={(e) => setHospitalForm({ ...hospitalForm, website: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Billing Currency Symbol
              </label>
              <input
                type="text"
                value={hospitalForm.currency}
                onChange={(e) => setHospitalForm({ ...hospitalForm, currency: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Tax / GST (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={hospitalForm.taxRate}
                onChange={(e) => setHospitalForm({ ...hospitalForm, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GSTIN / Tax Registration Number
              </label>
              <input
                type="text"
                value={hospitalForm.gstNumber}
                onChange={(e) => setHospitalForm({ ...hospitalForm, gstNumber: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingHospital}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingHospital ? 'Saving...' : 'Save Hospital Profile'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Admin Security */}
      {activeTab === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Information */}
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Admin Personal Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin Full Name
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Email (Cannot be changed)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm"
              >
                {savingProfile ? 'Updating...' : 'Update Admin Info'}
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" /> Change Security Password
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Database & Reset */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hospital Database State & Cleanup</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                MediCare HMS is currently running in a fresh, clean operational state with 0 fake doctor entries and 0 fake patient entries.
                You can add real clinical staff, patients, appointments, and bills. If you ever need to purge test transactions, click below to reset to a completely fresh database.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Database Engine: <span className="font-mono font-semibold text-slate-700">PostgreSQL (medicare_hms)</span>
            </div>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Purge & Reset to Clean Database</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDemoData}
        loading={resetting}
        title="Reset to Fresh Clean Database"
        message="This will wipe all existing transactions, appointments, invoices, patients, and doctors, resetting the system to a clean fresh slate. Your admin login account will remain intact. Proceed?"
        confirmText="Confirm Clean Reset"
        variant="warning"
      />
    </div>
  );
};
