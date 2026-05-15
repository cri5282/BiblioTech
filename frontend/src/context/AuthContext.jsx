import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Decode JWT payload without verifying signature (client-side only)
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearTokens = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  const login = useCallback((newAccessToken, newRefreshToken) => {
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    const payload = decodeToken(newAccessToken);
    setUser(payload ? { userId: payload.userId, email: payload.email, role: payload.role } : null);
    setAccessToken(newAccessToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
  }, [clearTokens]);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedAccessToken = localStorage.getItem('accessToken');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedAccessToken && !isTokenExpired(storedAccessToken)) {
        const payload = decodeToken(storedAccessToken);
        setUser(payload ? { userId: payload.userId, email: payload.email, role: payload.role } : null);
        setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
      } else if (storedRefreshToken) {
        // Access token expired but refresh token present — try to refresh
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });
          login(data.accessToken, data.refreshToken);
        } catch {
          clearTokens();
        }
      } else {
        clearTokens();
      }

      setLoading(false);
    };

    restoreSession();
  }, [login, clearTokens]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isAuthenticated, isAdmin: user?.role === 'admin', loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
