import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, } from '@dnd-kit/sortable';
import { Button, cn } from '@netrun-cms/ui';
import { LayoutGrid, Columns2, Columns3, PanelLeft, PanelRight, } from 'lucide-react';
import { SortableBlock } from './SortableBlock';
import { GridOverlay } from './GridOverlay';
// Block type labels for the drag handle toolbar
const blockTypeLabels = {
    hero: 'Hero',
    text: 'Text',
    image: 'Image',
    gallery: 'Gallery',
    video: 'Video',
    cta: 'CTA',
    feature_grid: 'Features',
    testimonial: 'Testimonial',
    faq: 'FAQ',
    code_block: 'Code',
    contact_form: 'Contact',
    stats_bar: 'Stats',
};
const layoutPresets = [
    { label: '1 Column', icon: LayoutGrid, spans: [12], title: 'Full width' },
    { label: '2 Columns', icon: Columns2, spans: [6, 6], title: 'Two columns' },
    { label: '3 Columns', icon: Columns3, spans: [4, 4, 4], title: 'Three columns' },
    { label: 'Sidebar L', icon: PanelLeft, spans: [4, 8], title: 'Sidebar left' },
    { label: 'Sidebar R', icon: PanelRight, spans: [8, 4], title: 'Sidebar right' },
];
/**
 * DnD-enabled 12-column grid layout for content blocks.
 * Blocks can be reordered via drag-and-drop and resized via edge handles.
 */
export function BlockGrid({ blocks, selectedBlockId, onSelect, onReorder, onResize, renderBlock, }) {
    const [activeId, setActiveId] = useState(null);
    const [activePreset, setActivePreset] = useState(null);
    // Require a small movement before starting drag to avoid conflicts with click
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
    }));
    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(blocks, oldIndex, newIndex);
                onReorder(reordered);
            }
        }
    }, [blocks, onReorder]);
    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);
    // Apply a layout preset to the first N blocks
    const applyPreset = useCallback((presetIndex) => {
        const preset = layoutPresets[presetIndex];
        if (!preset)
            return;
        setActivePreset(presetIndex);
        setTimeout(() => setActivePreset(null), 600);
        const updatedBlocks = blocks.map((block, i) => {
            const spanIndex = i % preset.spans.length;
            return { ...block, colSpan: preset.spans[spanIndex] };
        });
        onReorder(updatedBlocks);
    }, [blocks, onReorder]);
    const activeBlock = activeId
        ? blocks.find((b) => b.id === activeId)
        : null;
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex gap-2 flex-wrap", children: layoutPresets.map((preset, i) => {
                    const Icon = preset.icon;
                    return (_jsxs(Button, { variant: "outline", size: "sm", title: preset.title, onClick: () => applyPreset(i), className: cn('text-xs gap-1.5', activePreset === i && 'ring-2 ring-primary border-primary'), children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), preset.label] }, preset.label));
                }) }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onDragCancel: handleDragCancel, children: _jsxs("div", { className: "relative", children: [_jsx(GridOverlay, { visible: activeId !== null, activeColumn: undefined, activeColSpan: activeBlock?.colSpan ?? 12 }), _jsx(SortableContext, { items: blocks.map((b) => b.id), strategy: rectSortingStrategy, children: _jsx("div", { className: "grid gap-3", style: { gridTemplateColumns: 'repeat(12, 1fr)' }, children: blocks.map((block) => {
                                    const isSelected = selectedBlockId === block.id;
                                    return (_jsx(SortableBlock, { id: block.id, colSpan: block.colSpan ?? 12, isSelected: isSelected, blockTypeLabel: blockTypeLabels[block.type] || block.type, onSelect: () => onSelect(isSelected ? null : block.id), onResize: (newSpan) => onResize(block.id, newSpan), children: renderBlock(block, isSelected) }, block.id));
                                }) }) }), _jsx(DragOverlay, { children: activeBlock ? (_jsx("div", { className: "opacity-80 shadow-2xl ring-2 ring-primary rounded-lg overflow-hidden", style: {
                                    width: activeBlock.colSpan
                                        ? `${(activeBlock.colSpan / 12) * 100}%`
                                        : '100%',
                                }, children: renderBlock(activeBlock, false) })) : null })] }) }), selectedBlockId && (() => {
                const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
                if (!selectedBlock)
                    return null;
                // The editor is rendered via renderBlock with isSelected=true
                // which includes the CardContent editor below the BlockPreview.
                // We don't render it again here — it's part of the renderBlock output above.
                return null;
            })()] }));
}
//# sourceMappingURL=BlockGrid.js.map