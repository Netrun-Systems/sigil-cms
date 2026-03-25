/**
 * CashTenderModal — Cash payment entry with quick-select denominations
 */
interface CashTenderModalProps {
    total: number;
    onConfirm: (cashAmount: number) => void;
    onClose: () => void;
}
export declare function CashTenderModal({ total, onConfirm, onClose }: CashTenderModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CashTenderModal.d.ts.map