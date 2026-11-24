const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('medicare_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('medicare_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('medicare_token');
};

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: any }> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      removeAuthToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Server request failed');
    }
    return json;
  } catch (error: any) {
    throw error;
  }
}
