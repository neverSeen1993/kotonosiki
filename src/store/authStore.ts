import { create } from 'zustand';
import { AuthSession, User, UserRole } from '../types';
import { api } from '../utils/api';

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
      const session = await api.get<AuthSession | null>('/session');
      if (session?.userId) {
        set({ session, isAuthenticated: true, role: session.role });
      }
    } catch {
      // no session yet
    }
  },

  login: async (login, password) => {
    const users = await api.get<User[]>('/users');
    const user = users.find((u) => u.login === login && u.passwordHash === btoa(password));
    if (!user) return false;
    const session: AuthSession = { userId: user.id, role: user.role, name: user.name };
    await api.post('/session', session);
    set({ session, isAuthenticated: true, role: user.role });
    return true;
  },

  logout: async () => {
    await api.del('/session');
    set({ session: null, isAuthenticated: false, role: null });
  },
}));
