import { type DocumentInfo } from '../../lib/advisor';
interface Props {
    documents: DocumentInfo[];
    sessionId: string;
    onDocumentsChange: (docs: DocumentInfo[]) => void;
}
export declare function DocumentManager({ documents, sessionId, onDocumentsChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DocumentManager.d.ts.map