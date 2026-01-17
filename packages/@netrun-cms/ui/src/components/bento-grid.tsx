/**
 * BentoGrid Component - Modular grid layout for touch interfaces
 *
 * Implements the Bento Box layout pattern for information-dense
 * touch interfaces. Provides predictable, rectangular hit targets.
 *
 * Part of Modern Touch UI Standards implementation.
 */

import React from 'react';
import { cn } from '../lib/utils';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns at different breakpoints */
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

export interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column span (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span (1-4) */
  rowSpan?: 1 | 2 | 3 | 4;
  /** Make item span full row on mobile */
  fullWidthMobile?: boolean;
  /** Glass effect variant */
  variant?: 'default' | 'glass' | 'elevated';
}

const gapStyles = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6',
};

/**
 * BentoGrid Component
 *
 * A CSS Grid-based layout system optimized for touch interfaces.
 * Automatically adjusts columns based on viewport width.
 *
 * @example
 * ```tsx
 * <BentoGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
 *   <BentoItem colSpan={2} rowSpan={2} variant="glass">
 *     <h2>Featured Content</h2>
 *   </BentoItem>
 *   <BentoItem>
 *     <StatCard title="Users" value="1,234" />
 *   </BentoItem>
 * </BentoGrid>
 * ```
 */
export function BentoGrid({
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 'md',
  className,
  children,
  ...props
}: BentoGridProps) {
  // Generate grid-template-columns based on breakpoints
  const gridColsClass = cn(
    // Mobile
    columns.mobile === 1
      ? 'grid-cols-1'
      : columns.mobile === 2
        ? 'grid-cols-2'
        : 'grid-cols-1',
    // Tablet (sm breakpoint)
    columns.tablet === 2
      ? 'sm:grid-cols-2'
      : columns.tablet === 3
        ? 'sm:grid-cols-3'
        : 'sm:grid-cols-2',
    // Desktop (lg breakpoint)
    columns.desktop === 3
      ? 'lg:grid-cols-3'
      : columns.desktop === 4
        ? 'lg:grid-cols-4'
        : columns.desktop === 5
          ? 'lg:grid-cols-5'
          : 'lg:grid-cols-4'
  );

  return (
    <div
      className={cn(
        'grid',
        gridColsClass,
        gapStyles[gap],
        // Safe area padding
        'px-4 sm:px-6 lg:px-8',
        'pl-safe pr-safe',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * BentoItem Component
 *
 * A grid item that can span multiple columns and rows.
 * Use within BentoGrid for responsive bento layouts.
 */
export function BentoItem({
  colSpan = 1,
  rowSpan = 1,
  fullWidthMobile = false,
  variant = 'default',
  className,
  children,
  ...props
}: BentoItemProps) {
  const spanClasses = cn(
    // Column span
    colSpan === 2 && 'sm:col-span-2',
    colSpan === 3 && 'sm:col-span-3',
    colSpan === 4 && 'sm:col-span-4',
    // Row span
    rowSpan === 2 && 'row-span-2',
    rowSpan === 3 && 'row-span-3',
    rowSpan === 4 && 'row-span-4',
    // Full width on mobile
    fullWidthMobile && 'col-span-full sm:col-span-1'
  );

  const variantClasses = cn(
    // Base styles
    'rounded-2xl overflow-hidden',
    // Variant-specific
    variant === 'default' && 'bg-white border border-gray-100',
    variant === 'glass' && 'glass-card',
    variant === 'elevated' && 'bg-white shadow-lg border border-gray-100'
  );

  return (
    <div
      className={cn(
        spanClasses,
        variantClasses,
        'min-h-[120px]',
        'transition-transform duration-200',
        'hover:scale-[1.02]',
        'touch-active',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default BentoGrid;
