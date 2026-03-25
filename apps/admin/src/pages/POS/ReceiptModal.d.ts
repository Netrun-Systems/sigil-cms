/**
 * ReceiptModal — Display receipt after a transaction with print/email options
 */
interface ReceiptModalProps {
    receipt: Record<string, unknown>;
    basePath: string;
    onClose: () => void;
}
export declare function ReceiptModal({ receipt, onClose }: ReceiptModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ReceiptModal.d.ts.map