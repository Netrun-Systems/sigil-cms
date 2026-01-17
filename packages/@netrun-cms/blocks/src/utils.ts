/**
 * @netrun-cms/blocks - Utility functions
 *
 * Shared utilities for block components including
 * className merging and common helpers.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Common block mode type
 */
export type BlockMode = 'view' | 'edit';

/**
 * Common block props interface
 */
export interface BaseBlockProps<T> {
  /** Block content data */
  content: T;
  /** Block display settings */
  settings?: BlockSettingsProps;
  /** Whether the block is in edit or view mode */
  mode?: BlockMode;
  /** Additional CSS classes */
  className?: string;
  /** Callback when content is updated (edit mode) */
  onContentChange?: (content: T) => void;
}

/**
 * Block settings props mapped to CSS
 */
export interface BlockSettingsProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'primary' | 'secondary' | 'surface' | 'gradient';
  width?: 'full' | 'container' | 'narrow';
  animation?: 'none' | 'fade' | 'slide' | 'scale';
  customClass?: string;
}

/**
 * Map padding setting to Tailwind classes
 */
export function getPaddingClass(padding?: BlockSettingsProps['padding']): string {
  const paddingMap: Record<string, string> = {
    none: 'p-0',
    sm: 'py-8 px-4',
    md: 'py-12 px-4',
    lg: 'py-16 px-4',
    xl: 'py-20 px-4',
  };
  return paddingMap[padding || 'lg'];
}

/**
 * Map margin setting to Tailwind classes
 */
export function getMarginClass(margin?: BlockSettingsProps['margin']): string {
  const marginMap: Record<string, string> = {
    none: 'm-0',
    sm: 'my-4',
    md: 'my-8',
    lg: 'my-12',
    xl: 'my-16',
  };
  return marginMap[margin || 'none'];
}

/**
 * Map background setting to Tailwind classes
 */
export function getBackgroundClass(background?: BlockSettingsProps['background']): string {
  const bgMap: Record<string, string> = {
    transparent: 'bg-transparent',
    primary: 'bg-[var(--netrun-primary)]',
    secondary: 'bg-[var(--netrun-background-secondary)]',
    surface: 'bg-[var(--netrun-surface)]',
    gradient: 'bg-gradient-to-br from-[var(--netrun-primary)] to-[var(--netrun-primary-dark)]',
  };
  return bgMap[background || 'transparent'];
}

/**
 * Map width setting to Tailwind classes
 */
export function getWidthClass(width?: BlockSettingsProps['width']): string {
  const widthMap: Record<string, string> = {
    full: 'w-full',
    container: 'container mx-auto max-w-6xl',
    narrow: 'container mx-auto max-w-4xl',
  };
  return widthMap[width || 'container'];
}

/**
 * Combine all settings into a single className
 */
export function getBlockSettingsClasses(settings?: BlockSettingsProps): string {
  return cn(
    getPaddingClass(settings?.padding),
    getMarginClass(settings?.margin),
    getBackgroundClass(settings?.background),
    settings?.customClass
  );
}
