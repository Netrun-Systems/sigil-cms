import type { BlockType } from '@netrun-cms/core';
interface ContentBlock {
    id: string;
    type: BlockType;
    content: Record<string, unknown>;
    isVisible: boolean;
    colSpan?: number;
}
interface BlockGridProps {
    blocks: ContentBlock[];
    selectedBlockId: string | null;
    onSelect: (id: string | null) => void;
    onReorder: (blocks: ContentBlock[]) => void;
    onResize: (blockId: string, colSpan: number) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onDuplicate?: (id: string) => void;
    renderBlock: (block: ContentBlock, isSelected: boolean) => React.ReactNode;
}
/**
 * DnD-enabled 12-column grid layout for content blocks.
 * Blocks can be reordered via drag-and-drop and resized via edge handles.
 */
export declare function BlockGrid({ blocks, selectedBlockId, onSelect, onReorder, onResize, renderBlock, }: BlockGridProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=BlockGrid.d.ts.map