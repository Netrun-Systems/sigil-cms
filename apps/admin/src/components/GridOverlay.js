import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@netrun-cms/ui';
/**
 * 12-column grid overlay shown during drag operations.
 * Renders dotted column guides and highlights the active drop zone.
 */
export function GridOverlay({ visible, activeColumn, activeColSpan }) {
    if (!visible)
        return null;
    return (_jsx("div", { className: "absolute inset-0 pointer-events-none z-10", style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 0,
        }, children: Array.from({ length: 12 }, (_, i) => {
            const isActive = activeColumn !== undefined &&
                activeColSpan !== undefined &&
                i >= activeColumn &&
                i < activeColumn + activeColSpan;
            return (_jsx("div", { className: cn('border-r border-dashed border-primary/10 h-full transition-colors duration-150', i === 0 && 'border-l', isActive && 'bg-primary/5') }, i));
        }) }));
}
//# sourceMappingURL=GridOverlay.js.map