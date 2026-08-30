import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSession, setSession, clearSession } from '../lib/session';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(() => getSession());

  const user = session?.user || null;
  const token = session?.token || null;

  const persist = useCallback((next) => {
    setSession(next);
    setSessionState(next);
  }, []);

  // Agency admin: email + bcrypt password -> 7-day JWT (PDD §5.1.1).
  const loginAdmin = useCallback(
    async (email, password) => {
      const res = await authApi.login(email, password);
      persist({ token: res.token, user: res.user });
      return res.user;
    },
    [persist]
  );

  // External reviewer: exchange a magic-link token for a project-scoped
  // client session (PDD §5.1.2 / §5.1.3).
  const loginWithMagicLink = useCallback(
    async (linkToken) => {
      const res = await authApi.verifyMagicLink(linkToken);
      persist({ token: res.token, user: res.user });
      return res; // { token, user, project } — portal needs the scoped project
    },
    [persist]
  );

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    loginAdmin,
    loginWithMagicLink,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
