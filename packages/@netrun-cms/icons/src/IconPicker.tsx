/**
 * IconPicker — admin component for browsing and selecting icons.
 * Uses Radix-compatible Dialog/Input patterns that work with both the Shadcn
 * UI layer and standalone usage.
 *
 * NOTE: This file intentionally has no dependency on @netrun-cms/ui so that
 * the icons package can be used without the full design system. It renders
 * a self-contained modal using basic HTML + Tailwind classes.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from './Icon';
import {
  searchIcons,
  ICON_CATEGORIES,
  ICON_CATEGORY_LABELS,
} from './registry';
import type { IconMeta, IconPickerProps } from './types';

// ─── Minimal modal shell (no Radix dep) ─────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
};

// ─── Category tab pill ───────────────────────────────────────────────────────

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    ].join(' ')}
  >
    {label}
  </button>
);

// ─── Icon grid item ──────────────────────────────────────────────────────────

interface IconItemProps {
  meta: IconMeta;
  selected: boolean;
  onSelect: (name: string) => void;
}

const IconItem: React.FC<IconItemProps> = ({ meta, selected, onSelect }) => (
  <button
    type="button"
    title={meta.label}
    onClick={() => onSelect(meta.name)}
    className={[
      'flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors group',
      selected
        ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    ].join(' ')}
  >
    <Icon
      name={meta.name}
      size={20}
      className={selected ? 'text-white dark:text-gray-900' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}
    />
    <span className="text-[10px] leading-tight text-center max-w-full truncate w-full">
      {meta.label}
    </span>
  </button>
);

// ─── IconPicker ──────────────────────────────────────────────────────────────

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  vertical,
  placeholder = 'Search icons…',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<IconMeta['category'] | 'all'>('all');

  const results = useMemo(
    () =>
      searchIcons(query, {
        category: activeCategory === 'all' ? undefined : activeCategory,
        vertical,
      }),
    [query, activeCategory, vertical]
  );

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name);
      setOpen(false);
    },
    [onChange]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveCategory('all');
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm hover:border-gray-400 transition-colors',
          className ?? '',
        ].join(' ')}
      >
        {value ? (
          <>
            <Icon name={value} size={16} />
            <span>{value}</span>
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-auto opacity-60"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Modal */}
      <Modal open={open} onClose={handleClose}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex-1 relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close icon picker"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0 scrollbar-none">
          <Tab
            label="All"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {ICON_CATEGORIES.map((cat) => (
            <Tab
              key={cat}
              label={ICON_CATEGORY_LABELS[cat]}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>

        {/* Results count */}
        <div className="px-4 py-1.5 shrink-0">
          <p className="text-xs text-gray-400">
            {results.length} icon{results.length !== 1 ? 's' : ''}
            {query ? ` for "${query}"` : ''}
          </p>
        </div>

        {/* Icon grid — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon name="Search" size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No icons found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
              {results.map((meta) => (
                <IconItem
                  key={meta.name}
                  meta={meta}
                  selected={value === meta.name}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — selected icon preview */}
        {value && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Icon name={value} size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Selected icon</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange('');
              }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

IconPicker.displayName = 'IconPicker';

export default IconPicker;
