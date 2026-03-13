import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { session, isAuthenticated, role, login, logout } = useAuthStore();
  return {
    session,
    isAuthenticated,
    role,
    isAdmin: role === 'admin',
    isHelper: role === 'helper',
    isViewer: role === 'viewer',
    canEdit: role === 'admin',
    login,
    logout,
  };
}
