import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge, cn } from '@netrun-cms/ui';
import { useRef, useCallback, useState } from 'react';
/**
 * Wraps a content block with @dnd-kit sortable behavior and a resize handle.
 * Each block occupies `colSpan` columns out of 12 in the CSS grid.
 */
export function SortableBlock({ id, colSpan, isSelected, blockTypeLabel, onSelect, onResize, children, }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id });
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null);
    const blockRef = useRef(null);
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${colSpan} / span ${colSpan}`,
    };
    // Resize handle drag logic: compute colSpan from mouse position relative to grid
    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const gridEl = blockRef.current?.parentElement;
        if (!gridEl)
            return;
        const gridRect = gridEl.getBoundingClientRect();
        const colWidth = gridRect.width / 12;
        const onMouseMove = (ev) => {
            const relX = ev.clientX - gridRect.left;
            // Calculate how many columns the block should span based on where the right edge is
            const blockLeft = blockRef.current
                ? blockRef.current.getBoundingClientRect().left - gridRect.left
                : 0;
            const spanPx = relX - blockLeft;
            let newSpan = Math.round(spanPx / colWidth);
            newSpan = Math.max(3, Math.min(12, newSpan));
            setResizePreview(newSpan);
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setIsResizing(false);
            if (resizePreview !== null) {
                // Use the latest preview value via the state update
                setResizePreview((prev) => {
                    if (prev !== null)
                        onResize(prev);
                    return null;
                });
            }
            else {
                setResizePreview(null);
            }
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onResize, resizePreview]);
    const displaySpan = resizePreview ?? colSpan;
    return (_jsxs("div", { ref: (node) => {
            setNodeRef(node);
            blockRef.current = node;
        }, style: {
            ...style,
            gridColumn: `span ${displaySpan} / span ${displaySpan}`,
        }, className: cn('relative group/block', isDragging && 'opacity-50 scale-[1.02] shadow-lg ring-2 ring-primary z-20', isResizing && 'select-none'), onClick: onSelect, children: [_jsxs("div", { className: "absolute -top-3 left-2 z-10 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity", children: [_jsxs("div", { ...attributes, ...listeners, className: "flex items-center gap-1 rounded-md bg-card border px-2 py-0.5 cursor-grab active:cursor-grabbing shadow-sm", children: [_jsx(GripVertical, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("span", { className: "text-xs text-muted-foreground font-medium", children: blockTypeLabel })] }), displaySpan < 12 && (_jsxs(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0", children: [displaySpan, "/12"] }))] }), isResizing && resizePreview !== null && (_jsx("div", { className: "absolute -top-8 right-0 z-20", children: _jsxs(Badge, { className: "bg-primary text-primary-foreground text-xs", children: [resizePreview, "/12 cols"] }) })), children, _jsx("div", { onMouseDown: handleResizeStart, className: cn('absolute top-0 right-0 w-2 h-full cursor-col-resize z-10', 'opacity-0 group-hover/block:opacity-100 transition-opacity', 'hover:bg-primary/20 active:bg-primary/30', isResizing && 'opacity-100 bg-primary/30'), children: _jsx("div", { className: "absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full bg-primary/40" }) })] }));
}
//# sourceMappingURL=SortableBlock.js.map