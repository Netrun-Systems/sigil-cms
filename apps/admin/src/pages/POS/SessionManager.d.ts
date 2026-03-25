/**
 * SessionManager — Open/close register sessions with cash reconciliation
 */
interface Session {
    id: string;
    cashier_name: string;
    opened_at: string;
    status: string;
}
interface SessionManagerProps {
    basePath: string;
    session: Session | null;
    onSessionOpened: (session: Session) => void;
    onSessionClosed: () => void;
    onCancel: () => void;
}
export declare function SessionManager({ basePath, session, onSessionOpened, onSessionClosed, onCancel }: SessionManagerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SessionManager.d.ts.map