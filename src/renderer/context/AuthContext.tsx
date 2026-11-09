import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { USER_ROLES, type User } from '../../shared/types';

const STORAGE_KEY = 'zs.session';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const user = value as User;
  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.created_at === 'string' &&
    (USER_ROLES as readonly string[]).includes(user.role)
  );
}

function readStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => readStoredUser());

  const setUser = useCallback((next: User) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUserState(next);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, logout }), [user, setUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
