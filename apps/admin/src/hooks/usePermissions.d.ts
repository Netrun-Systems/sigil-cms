import type { UserRole } from '../lib/auth';
export declare function usePermissions(): {
    canEdit: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
    canPublish: boolean;
    canViewAnalytics: boolean;
    isAdmin: boolean;
    isEditor: boolean;
    isAuthor: boolean;
    isViewer: boolean;
    role: UserRole;
};
//# sourceMappingURL=usePermissions.d.ts.map