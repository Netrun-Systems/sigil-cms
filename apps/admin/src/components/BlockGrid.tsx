import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button, cn } from '@netrun-cms/ui';
import {
  LayoutGrid,
  Columns2,
  Columns3,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import { SortableBlock } from './SortableBlock';
import { GridOverlay } from './GridOverlay';
import type { BlockType } from '@netrun-cms/core';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  isVisible: boolean;
  colSpan?: number;
}

// Block type labels for the drag handle toolbar
const blockTypeLabels: Record<string, string> = {
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

interface LayoutPreset {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  spans: number[];
  title: string;
}

const layoutPresets: LayoutPreset[] = [
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
export function BlockGrid({
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
  onResize,
  renderBlock,
}: BlockGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // Require a small movement before starting drag to avoid conflicts with click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
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
    },
    [blocks, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Apply a layout preset to the first N blocks
  const applyPreset = useCallback(
    (presetIndex: number) => {
      const preset = layoutPresets[presetIndex];
      if (!preset) return;

      setActivePreset(presetIndex);
      setTimeout(() => setActivePreset(null), 600);

      const updatedBlocks = blocks.map((block, i) => {
        const spanIndex = i % preset.spans.length;
        return { ...block, colSpan: preset.spans[spanIndex] };
      });
      onReorder(updatedBlocks);
    },
    [blocks, onReorder]
  );

  const activeBlock = activeId
    ? blocks.find((b) => b.id === activeId)
    : null;

  return (
    <div className="space-y-3">
      {/* Layout Preset Buttons */}
      <div className="flex gap-2 flex-wrap">
        {layoutPresets.map((preset, i) => {
          const Icon = preset.icon;
          return (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              title={preset.title}
              onClick={() => applyPreset(i)}
              className={cn(
                'text-xs gap-1.5',
                activePreset === i && 'ring-2 ring-primary border-primary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Grid container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative">
          {/* Grid overlay shown during drag */}
          <GridOverlay
            visible={activeId !== null}
            activeColumn={undefined}
            activeColSpan={activeBlock?.colSpan ?? 12}
          />

          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
            >
              {blocks.map((block) => {
                const isSelected = selectedBlockId === block.id;
                return (
                  <SortableBlock
                    key={block.id}
                    id={block.id}
                    colSpan={block.colSpan ?? 12}
                    isSelected={isSelected}
                    blockTypeLabel={blockTypeLabels[block.type] || block.type}
                    onSelect={() => onSelect(isSelected ? null : block.id)}
                    onResize={(newSpan) => onResize(block.id, newSpan)}
                  >
                    {renderBlock(block, isSelected)}
                  </SortableBlock>
                );
              })}
            </div>
          </SortableContext>

          {/* Drag overlay for smooth visual feedback */}
          <DragOverlay>
            {activeBlock ? (
              <div
                className="opacity-80 shadow-2xl ring-2 ring-primary rounded-lg overflow-hidden"
                style={{
                  width: activeBlock.colSpan
                    ? `${(activeBlock.colSpan / 12) * 100}%`
                    : '100%',
                }}
              >
                {renderBlock(activeBlock, false)}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>

      {/* Selected block editor — renders below the grid, outside grid cells */}
      {selectedBlockId && (() => {
        const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
        if (!selectedBlock) return null;
        // The editor is rendered via renderBlock with isSelected=true
        // which includes the CardContent editor below the BlockPreview.
        // We don't render it again here — it's part of the renderBlock output above.
        return null;
      })()}
    </div>
  );
}
