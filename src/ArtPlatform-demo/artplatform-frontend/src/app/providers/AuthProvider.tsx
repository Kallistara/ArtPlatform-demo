import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse } from '../../shared/api/auth.api';
import { login as loginRequest, register as registerRequest } from '../../shared/api/auth.api';
import { getMyProfile } from '../../shared/api/profile.api';

type AuthUser = {
  userId: string;
  token: string;
  tokenType: string;
  role: 'Unauthorized' | 'User' | 'Artist' | 'Admin';
  username?: string;
  displayName?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'artplatform_auth';

function toUser(data: AuthResponse): AuthUser {
  return {
    userId: data.userId,
    token: data.accessToken,
    tokenType: data.tokenType || 'Bearer',
    role: 'Unauthorized',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const refreshUser = async () => {
    if (!user?.token) return;
    const profile = await getMyProfile();
    setUser((prev) =>
      prev
        ? {
            ...prev,
            userId: profile.userId,
            role: profile.role,
            username: profile.userName,
            displayName: profile.displayName,
          }
        : prev
    );
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.token),
      isAdmin: user?.role === 'Admin',
      login: async (username, password) => {
        const res = await loginRequest({ username, password });
        const nextUser = toUser(res);
        setUser(nextUser);
        await refreshUser();
      },
      register: async (username, password, confirmPassword) => {
        await registerRequest({ username, password, confirmPassword });
        const res = await loginRequest({ username, password });
        setUser(toUser(res));
        await refreshUser();
      },
      logout: () => setUser(null),
      refreshUser,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}