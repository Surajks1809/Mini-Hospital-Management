import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Hospital,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, onOpenSearch }) => {
  const { user, hospital, settings, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    setCurrentDateFormatted(formatted);
  }, []);

  // Notifications demo feed
  const notifications = [
    {
      id: 1,
      title: "Today's Appointments",
      desc: '3 patients scheduled for OPD consultations today',
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'Pending Invoices',
      desc: '2 bills have outstanding balances requiring review',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Database Backup',
      desc: 'Automated PostgreSQL database health status: optimal',
      time: '3 hours ago',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Hospital Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Hospital className="w-4 h-4 text-blue-600" />
            <span className="truncate max-w-[260px] md:max-w-xs">
              {hospital?.name || settings?.hospitalName || 'MediCare Hospital'}
            </span>
          </div>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-sm text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all shadow-soft-sm group"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span>Search patients, doctors, appointments...</span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Current Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileDropdownOpen(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Notifications</span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  2 New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{n.desc}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-slate-800">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-blue-600 font-medium capitalize">
                {user?.role === 'ADMIN' ? 'Hospital Administrator' : user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Hospital Settings</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
