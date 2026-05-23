import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthResponse } from '../../shared/api/auth.api';
import {
  login as loginRequest,
  register as registerRequest,
} from '../../shared/api/auth.api';
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
  refreshUser: (tokenOverride?: string) => Promise<void>;
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

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const refreshUser = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? readStoredUser()?.token ?? user?.token;
    if (!token) return;

    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < 8) {
      try {
        const profile = await getMyProfile(token);

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

        return;
      } catch (error) {
        lastError = error;

        const message = error instanceof Error ? error.message.toLowerCase() : '';
        if (message.includes('401') || message.includes('403')) {
          throw error;
        }

        await sleep(250 + attempt * 250);
        attempt += 1;
      }
    }

    if (lastError instanceof Error) {
      console.warn('Profile sync failed after retries:', lastError.message);
    }
  }, [user?.token]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await loginRequest({ username, password });
      const nextUser = toUser(res);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);

      await refreshUser(nextUser.token);
    },
    [refreshUser]
  );

  const register = useCallback(
    async (username: string, password: string, confirmPassword: string) => {
      await registerRequest({ username, password, confirmPassword });

      const res = await loginRequest({ username, password });
      const nextUser = toUser(res);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);

      await refreshUser(nextUser.token);
    },
    [refreshUser]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.token),
      isAdmin: user?.role === 'Admin',
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}