interface SortableBlockProps {
    id: string;
    colSpan: number;
    isSelected: boolean;
    blockTypeLabel: string;
    onSelect: () => void;
    onResize: (colSpan: number) => void;
    children: React.ReactNode;
}
/**
 * Wraps a content block with @dnd-kit sortable behavior and a resize handle.
 * Each block occupies `colSpan` columns out of 12 in the CSS grid.
 */
export declare function SortableBlock({ id, colSpan, isSelected, blockTypeLabel, onSelect, onResize, children, }: SortableBlockProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=SortableBlock.d.ts.map