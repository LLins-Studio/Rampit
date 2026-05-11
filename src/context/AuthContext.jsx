import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rampit_token');
    const stored = localStorage.getItem('rampit_user');
    if (token && stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    let data;
    try {
      data = await apiLogin(credentials);
    } catch (_) {
      // Mock fallback while backend is not ready
      data = { token: 'mock-token', user: { id: '1', fullName: credentials.email.split('@')[0], email: credentials.email, phone: '', kycStatus: 'pending' } };
    }
    localStorage.setItem('rampit_token', data.token);
    localStorage.setItem('rampit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (credentials) => {
    let data;
    try {
      data = await apiRegister(credentials);
    } catch (_) {
      // Mock fallback while backend is not ready
      data = { token: 'mock-token', user: { id: '1', fullName: credentials.fullName, email: credentials.email, phone: credentials.phone, kycStatus: 'pending' } };
    }
    localStorage.setItem('rampit_token', data.token);
    localStorage.setItem('rampit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await apiLogout(); } catch (_) {}
    localStorage.removeItem('rampit_token');
    localStorage.removeItem('rampit_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
