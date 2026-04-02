// Generated using Claude
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const role = JSON.parse(localStorage.getItem('user') || '{}').role;
      let data;
      if (role === 'regular') {
        const res = await api.get('/users/me');
        data = res.data;
      } else if (role === 'business') {
        const res = await api.get('/businesses/me');
        data = res.data;
      } else if (role === 'admin') {
        data = JSON.parse(localStorage.getItem('user') || '{}');
      }
      if (data) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await api.post('/auth/tokens', { email, password });
    const { token } = res.data;
    localStorage.setItem('token', token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;
    let profile;
    if (role === 'regular') {
      const meRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      profile = meRes.data;
    } else if (role === 'business') {
      const meRes = await api.get('/businesses/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      profile = meRes.data;
    } else {
      profile = { role, email, id: payload.userId };
    }
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = fetchMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
