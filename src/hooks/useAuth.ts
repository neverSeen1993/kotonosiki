import { useAuthStore } from '../store/authStore';
import { PageAccess, PagePermissions } from '../types';

export function useAuth() {
  const { session, isAuthenticated, role, permissions, login, logout } = useAuthStore();

  const isNanny = role === 'nanny';

  /**
   * Check page-level access for the current user.
   * Admin: always 'edit'. Helper: always 'view'. Viewer: always 'view'.
   * Nanny: uses their per-page permission config.
   */
  const pageAccess = (page: keyof PagePermissions): PageAccess => {
    if (role === 'admin') return 'edit';
    if (role === 'nanny' && permissions) return permissions[page];
    // helper / viewer → view-only
    return 'view';
  };

  /**
   * Can the user see a given page at all?
   */
  const canViewPage = (page: keyof PagePermissions): boolean => {
    const access = pageAccess(page);
    return access === 'view' || access === 'edit';
  };

  /**
   * Can the user edit content on a given page?
   */
  const canEditPage = (page: keyof PagePermissions): boolean => {
    return pageAccess(page) === 'edit';
  };

  return {
    session,
    isAuthenticated,
    role,
    permissions,
    isAdmin: role === 'admin',
    isHelper: role === 'helper',
    isViewer: role === 'viewer',
    isNanny,
    canEdit: role === 'admin' || (isNanny && permissions ? Object.values(permissions).some((v) => v === 'edit') : false),
    canEditAdoption: role === 'admin' || role === 'helper',
    pageAccess,
    canViewPage,
    canEditPage,
    login,
    logout,
  };
}
