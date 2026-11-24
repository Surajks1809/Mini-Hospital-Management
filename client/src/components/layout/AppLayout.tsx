import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { PatientModal } from '../patients/PatientModal';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenAddPatient={() => setAddPatientOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar
          onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Dialog (Ctrl+K) */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Add Patient Modal (Global Shortcut) */}
      <PatientModal
        isOpen={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        onSaved={() => {
          setAddPatientOpen(false);
          // Broadcast custom event so patient tables refresh automatically
          window.dispatchEvent(new Event('patient:created'));
        }}
      />
    </div>
  );
};
