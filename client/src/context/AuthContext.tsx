import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Hospital, HospitalSetting } from '../types';
import { request, setAuthToken, removeAuthToken, getAuthToken } from '../api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  hospitalName: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  hospital: Hospital | null;
  settings: HospitalSetting | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [settings, setSettings] = useState<HospitalSetting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await request('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  const loadUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await request('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        if (res.hospital) {
          setHospital(res.hospital);
        }
        await fetchSettings();
      } else {
        removeAuthToken();
      }
    } catch (err) {
      removeAuthToken();
      setUser(null);
      setHospital(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const handleUnauthorized = () => {
      setUser(null);
      setHospital(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setUser(res.user);
      if (res.hospital) {
        setHospital(res.hospital);
      }
      await fetchSettings();
      return true;
    }
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setUser(res.user);
      if (res.hospital) {
        setHospital(res.hospital);
      }
      await fetchSettings();
      return true;
    }
    return false;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setHospital(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updated });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hospital,
        settings,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
