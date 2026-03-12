import { create } from 'zustand';
import { AuthSession, UserRole } from '../types';

interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  init: () => Promise<void>;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  role: null,

  init: async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) return; // not logged in — cookie missing or invalid
      const data = await res.json();
      const session: AuthSession = {
        userId: data.userId,
        role: data.role,
        name: data.name,
      };
      set({ session, isAuthenticated: true, role: data.role });
    } catch {
      // server unreachable
    }
  },

  login: async (login, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login, password }),
      });
      if (!res.ok) return false;

      const data = await res.json();
      const session: AuthSession = {
        userId: data.userId,
        role: data.role,
        name: data.name,
      };
      set({ session, isAuthenticated: true, role: data.role });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore */ }
    set({ session: null, isAuthenticated: false, role: null });
  },
}));
