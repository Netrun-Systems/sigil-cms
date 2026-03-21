import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/auth';

export function usePermissions() {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'viewer';

  return {
    canEdit: role === 'admin' || role === 'editor',
    canCreate: role === 'admin' || role === 'editor',
    canDelete: role === 'admin',
    canManageUsers: role === 'admin',
    canManageSettings: role === 'admin',
    canPublish: role === 'admin' || role === 'editor',
    canViewAnalytics: role === 'admin' || role === 'editor',
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
    isAuthor: role === 'author',
    isViewer: role === 'viewer',
    role,
  };
}
