import { type ReactNode } from 'react';
export type UserRole = 'admin' | 'editor' | 'author' | 'viewer';
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
}
interface AuthContextValue {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
export declare function RequireAuth({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=auth.d.ts.map