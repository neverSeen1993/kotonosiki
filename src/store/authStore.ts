import { create } from 'zustand';
import { AuthSession, UserRole } from '../types';
import { loadSession, saveSession, loadUsers } from '../utils/localStorage';

interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (login: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: loadSession(),
  isAuthenticated: !!loadSession(),
  role: loadSession()?.role ?? null,

  login: (login, password) => {
    const users = loadUsers();
    const user = users.find(
      (u) => u.login === login && u.passwordHash === btoa(password)
    );
    if (!user) return false;
    const session: AuthSession = {
      userId: user.id,
      role: user.role,
      name: user.name,
    };
    saveSession(session);
    set({ session, isAuthenticated: true, role: user.role });
    return true;
  },

  logout: () => {
    saveSession(null);
    set({ session: null, isAuthenticated: false, role: null });
  },
}));
