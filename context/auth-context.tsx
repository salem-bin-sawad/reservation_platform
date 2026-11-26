'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ApiError, authApi } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

const TOKEN_KEY = 'office_portal_token';
const USER_KEY = 'office_portal_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshProfile: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;
          if (parsedUser.role === 'office') {
            setToken(storedToken);
            setUser(parsedUser);
            // Verify token in background
            try {
              const fresh = await authApi.getProfile(storedToken);
              if (!active) return;
              if (fresh.role !== 'office') {
                clearSession();
              } else {
                setUser(fresh);
                localStorage.setItem(USER_KEY, JSON.stringify(fresh));
              }
            } catch (err) {
              if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                clearSession();
              }
            }
          } else {
            clearSession();
          }
        }
      } catch {
        clearSession();
      } finally {
        if (active) setIsReady(true);
      }
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login(identifier, password);
    if (res.user.role !== 'office') {
      throw new ApiError(
        'هذه البوابة مخصصة لحسابات المكاتب ومزودي الخدمة فقط (office).',
        403
      );
    }
    setToken(res.accessToken);
    setUser(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      // ignore storage errors
    }
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    const fresh = await authApi.getProfile(token);
    setUser(fresh);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
    } catch {
      // ignore storage errors
    }
    return fresh;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isReady,
        isAuthenticated: Boolean(token && user && user.role === 'office'),
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
