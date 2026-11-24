import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Activity,
  UserCheck,
  Building2,
  User,
  Phone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/common/Logo';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up states
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password', 'Missing Credentials');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        success('Welcome to MediCare HMS Portal', 'Login Successful');
        navigate('/');
      } else {
        error('Invalid email or password. Please verify credentials.', 'Authentication Failed');
      }
    } catch (err: any) {
      error(err.message || 'Login failed. Please verify credentials.', 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      error('Please enter your full name', 'Validation Error');
      return;
    }
    if (!hospitalName.trim()) {
      error('Please enter your hospital or clinic name', 'Validation Error');
      return;
    }
    if (!signupEmail.trim()) {
      error('Please enter a valid work email address', 'Validation Error');
      return;
    }
    if (signupPassword.length < 6) {
      error('Password must be at least 6 characters long', 'Weak Password');
      return;
    }
    if (signupPassword !== confirmPassword) {
      error('Password confirmation does not match', 'Password Mismatch');
      return;
    }

    setLoading(true);
    try {
      const ok = await register({
        name: doctorName.trim(),
        hospitalName: hospitalName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim() || undefined,
        password: signupPassword,
      });

      if (ok) {
        success('Hospital created! Welcome to your private MediCare workspace.', 'Registration Successful');
        navigate('/');
      } else {
        error('Could not complete registration. Please try with another email.', 'Registration Failed');
      }
    } catch (err: any) {
      error(err.message || 'Registration failed. Email might already be registered.', 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMode('signin');
    setEmail('admin@medicare.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-soft-xl">
            <Logo size="lg" showText={false} />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Medi<span className="text-blue-400">Care</span> HMS
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Enterprise Hospital Management & Clinical Operations System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Register New Hospital
            </button>
          </div>

          {/* SIGN IN FORM */}
          {mode === 'signin' ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Sign in to your account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized doctor, administrator, and clinical personnel only.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@medicare.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center text-slate-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2" />
                    Remember this device
                  </label>
                  <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">Forgot password?</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Credentials Assistant */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="bg-blue-50/80 rounded-2xl p-3.5 border border-blue-100 flex items-start justify-between gap-3">
                  <div className="text-xs">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" /> Default Demo Account
                    </div>
                    <div className="text-blue-700/80 mt-0.5 font-mono text-[11px]">
                      admin@medicare.com / admin123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shadow-soft-sm transition-all"
                  >
                    Auto-fill
                  </button>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-xs text-slate-500 hover:text-blue-600 font-medium"
                >
                  First time doctor or clinic owner? <span className="text-blue-600 font-bold underline">Create Hospital Account &rarr;</span>
                </button>
              </div>
            </div>
          ) : (
            /* SIGN UP / REGISTER NEW HOSPITAL FORM */
            <div>
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">Register Your Hospital / Clinic</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up your dedicated private hospital management portal in under 1 minute.
                </p>
              </div>

              {/* Data Isolation Security Notice */}
              <div className="mb-4 bg-teal-50/80 border border-teal-200/80 rounded-2xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-teal-900 leading-tight">
                  <span className="font-bold">100% Private & Isolated:</span> Your patients, doctors, appointments, and billing are completely secured in an isolated tenant. No other hospital can view or access your data.
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Doctor / Owner Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Doctor / Administrator Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Hospital / Clinic Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital / Clinic Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. Apex Multi-Speciality Clinic"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="doctor@apexclinic.com"
                        required
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Hospital Workspace...
                    </>
                  ) : (
                    <>
                      <span>Create Hospital Account & Start</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-slate-500 hover:text-blue-600 font-medium"
                >
                  Already registered your hospital? <span className="text-blue-600 font-bold underline">Sign In &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security accreditation badge */}
        <div className="mt-6 text-center flex items-center justify-center gap-4 text-slate-400 text-xs">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-bit SSL Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Activity className="w-4 h-4 text-teal-400" /> Multi-Tenant Isolated
          </span>
        </div>
      </div>
    </div>
  );
};
