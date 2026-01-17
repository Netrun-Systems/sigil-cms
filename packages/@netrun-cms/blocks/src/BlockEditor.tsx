/**
 * BlockEditor - Wrapper for editing blocks with settings panel
 *
 * Provides a visual editor wrapper around blocks with controls
 * for settings, visibility, ordering, and deletion.
 *
 * @module @netrun-cms/blocks
 * @author Netrun Systems
 */

import React, { useState } from 'react';
import {
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
  Palette,
  Layout,
  Sparkles,
} from 'lucide-react';
import type { ContentBlock, BlockContent, BlockSettings, BlockType } from '@netrun-cms/core';
import { cn } from './utils';
import { BlockRenderer } from './BlockRenderer';

export interface BlockEditorProps {
  /** The block being edited */
  block: ContentBlock;
  /** Whether this block is selected */
  isSelected?: boolean;
  /** Whether this is the first block */
  isFirst?: boolean;
  /** Whether this is the last block */
  isLast?: boolean;
  /** Callback when block is selected */
  onSelect?: () => void;
  /** Callback when block content changes */
  onContentChange?: (content: BlockContent) => void;
  /** Callback when block settings change */
  onSettingsChange?: (settings: BlockSettings) => void;
  /** Callback when block visibility toggles */
  onVisibilityChange?: (isVisible: boolean) => void;
  /** Callback when block is moved up */
  onMoveUp?: () => void;
  /** Callback when block is moved down */
  onMoveDown?: () => void;
  /** Callback when block is duplicated */
  onDuplicate?: () => void;
  /** Callback when block is deleted */
  onDelete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Settings panel tabs
 */
type SettingsTab = 'layout' | 'style' | 'animation';

/**
 * Block type labels for display
 */
const blockTypeLabels: Record<string, string> = {
  hero: 'Hero',
  text: 'Text',
  rich_text: 'Rich Text',
  image: 'Image',
  gallery: 'Gallery',
  video: 'Video',
  cta: 'Call to Action',
  feature_grid: 'Feature Grid',
  pricing_table: 'Pricing',
  testimonial: 'Testimonials',
  faq: 'FAQ',
  contact_form: 'Contact Form',
  code_block: 'Code Block',
  bento_grid: 'Bento Grid',
  stats_bar: 'Stats Bar',
  timeline: 'Timeline',
  newsletter: 'Newsletter',
  custom: 'Custom',
};

/**
 * BlockEditor component - wraps blocks with editing controls
 */
export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  isSelected = false,
  isFirst = false,
  isLast = false,
  onSelect,
  onContentChange,
  onSettingsChange,
  onVisibilityChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  className,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('layout');

  const handleContentChange = (_blockId: string, content: BlockContent) => {
    onContentChange?.(content);
  };

  const handleSettingChange = <K extends keyof BlockSettings>(
    key: K,
    value: BlockSettings[K]
  ) => {
    onSettingsChange?.({
      ...block.settings,
      [key]: value,
    });
  };

  return (
    <div
      className={cn(
        'relative group',
        !block.isVisible && 'opacity-50',
        className
      )}
    >
      {/* Block wrapper with selection outline */}
      <div
        className={cn(
          'relative transition-all',
          isSelected
            ? 'ring-2 ring-[var(--netrun-primary)] ring-offset-2 ring-offset-[var(--netrun-background)]'
            : 'hover:ring-1 hover:ring-[var(--netrun-primary)]/50'
        )}
        onClick={(e) => {
          // Only select if clicking the wrapper, not the content
          if (e.target === e.currentTarget) {
            onSelect?.();
          }
        }}
      >
        {/* Toolbar */}
        <div
          className={cn(
            'absolute -top-10 left-0 right-0 flex items-center justify-between px-2 py-1 rounded-t-lg transition-opacity z-10',
            'bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          {/* Left side - drag handle and type label */}
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-[var(--netrun-text-secondary)] cursor-grab" />
            <span className="text-xs font-medium text-[var(--netrun-text)]">
              {blockTypeLabels[block.blockType] || block.blockType}
            </span>
          </div>

          {/* Right side - action buttons */}
          <div className="flex items-center gap-1">
            {/* Move up */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={isFirst}
              className={cn(
                'p-1 rounded hover:bg-[var(--netrun-primary)]/10 transition-colors',
                isFirst && 'opacity-30 cursor-not-allowed'
              )}
              title="Move up"
            >
              <ChevronUp className="w-4 h-4 text-[var(--netrun-text)]" />
            </button>

            {/* Move down */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={isLast}
              className={cn(
                'p-1 rounded hover:bg-[var(--netrun-primary)]/10 transition-colors',
                isLast && 'opacity-30 cursor-not-allowed'
              )}
              title="Move down"
            >
              <ChevronDown className="w-4 h-4 text-[var(--netrun-text)]" />
            </button>

            <div className="w-px h-4 bg-[var(--netrun-primary)]/20 mx-1" />

            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVisibilityChange?.(!block.isVisible);
              }}
              className="p-1 rounded hover:bg-[var(--netrun-primary)]/10 transition-colors"
              title={block.isVisible ? 'Hide block' : 'Show block'}
            >
              {block.isVisible ? (
                <Eye className="w-4 h-4 text-[var(--netrun-text)]" />
              ) : (
                <EyeOff className="w-4 h-4 text-[var(--netrun-text-secondary)]" />
              )}
            </button>

            {/* Settings */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className={cn(
                'p-1 rounded transition-colors',
                showSettings
                  ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                  : 'hover:bg-[var(--netrun-primary)]/10 text-[var(--netrun-text)]'
              )}
              title="Block settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Duplicate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
              className="p-1 rounded hover:bg-[var(--netrun-primary)]/10 transition-colors"
              title="Duplicate block"
            >
              <Copy className="w-4 h-4 text-[var(--netrun-text)]" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-1 rounded hover:bg-red-500/10 transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Block content */}
        <div onClick={onSelect}>
          <BlockRenderer
            block={block}
            mode="edit"
            onContentChange={handleContentChange}
          />
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-2 p-4 rounded-lg bg-[var(--netrun-surface)] border border-[var(--netrun-primary)]/20">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-[var(--netrun-text)]">Block Settings</h4>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-[var(--netrun-primary)]/10 transition-colors"
            >
              <X className="w-4 h-4 text-[var(--netrun-text-secondary)]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'layout' as const, label: 'Layout', icon: Layout },
              { id: 'style' as const, label: 'Style', icon: Palette },
              { id: 'animation' as const, label: 'Animation', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                    : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-4">
            {activeTab === 'layout' && (
              <>
                {/* Padding */}
                <div>
                  <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                    Padding
                  </label>
                  <div className="flex gap-2">
                    {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => handleSettingChange('padding', value)}
                        className={cn(
                          'flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors',
                          block.settings?.padding === value
                            ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                            : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                    Width
                  </label>
                  <div className="flex gap-2">
                    {(['full', 'container', 'narrow'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => handleSettingChange('width', value)}
                        className={cn(
                          'flex-1 py-1.5 px-2 rounded text-xs font-medium capitalize transition-colors',
                          block.settings?.width === value
                            ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                            : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin */}
                <div>
                  <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                    Margin
                  </label>
                  <div className="flex gap-2">
                    {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((value) => (
                      <button
                        key={value}
                        onClick={() => handleSettingChange('margin', value)}
                        className={cn(
                          'flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors',
                          block.settings?.margin === value
                            ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                            : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'style' && (
              <>
                {/* Background */}
                <div>
                  <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                    Background
                  </label>
                  <div className="flex gap-2">
                    {(['transparent', 'primary', 'secondary', 'surface', 'gradient'] as const).map(
                      (value) => (
                        <button
                          key={value}
                          onClick={() => handleSettingChange('background', value)}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded text-xs font-medium capitalize transition-colors',
                            block.settings?.background === value
                              ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                              : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                          )}
                        >
                          {value}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Custom class */}
                <div>
                  <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                    Custom CSS Class
                  </label>
                  <input
                    type="text"
                    value={block.settings?.customClass || ''}
                    onChange={(e) => handleSettingChange('customClass', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--netrun-background)] border border-[var(--netrun-primary)]/20 text-[var(--netrun-text)] text-sm focus:border-[var(--netrun-primary)] focus:outline-none"
                    placeholder="e.g., my-custom-class"
                  />
                </div>
              </>
            )}

            {activeTab === 'animation' && (
              <div>
                <label className="block text-xs font-medium text-[var(--netrun-text-secondary)] mb-2">
                  Animation
                </label>
                <div className="flex gap-2">
                  {(['none', 'fade', 'slide', 'scale'] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => handleSettingChange('animation', value)}
                      className={cn(
                        'flex-1 py-1.5 px-2 rounded text-xs font-medium capitalize transition-colors',
                        block.settings?.animation === value
                          ? 'bg-[var(--netrun-primary)] text-[var(--netrun-background)]'
                          : 'bg-[var(--netrun-background)] text-[var(--netrun-text)] hover:bg-[var(--netrun-primary)]/10'
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;
