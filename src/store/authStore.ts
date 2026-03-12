import { create } from 'zustand';
import { AuthSession, User, UserRole } from '../types';
import { api } from '../utils/api';

const SESSION_KEY = 'kotonosiki_session';

function loadLocalSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthSession;
    return s?.userId ? s : null;
  } catch {
    return null;
  }
}

function saveLocalSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

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
    const session = loadLocalSession();
    if (session?.userId) {
      set({ session, isAuthenticated: true, role: session.role });
    }
  },

  login: async (login, password) => {
    const users = await api.get<User[]>('/users');
    const user = users.find((u) => u.login === login && u.passwordHash === btoa(password));
    if (!user) return false;
    const session: AuthSession = { userId: user.id, role: user.role, name: user.name };
    saveLocalSession(session);
    set({ session, isAuthenticated: true, role: user.role });
    return true;
  },

  logout: async () => {
    saveLocalSession(null);
    set({ session: null, isAuthenticated: false, role: null });
  },
}));
