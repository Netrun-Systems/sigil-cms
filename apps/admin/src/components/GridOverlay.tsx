import { cn } from '@netrun-cms/ui';

interface GridOverlayProps {
  visible: boolean;
  activeColumn?: number;
  activeColSpan?: number;
}

/**
 * 12-column grid overlay shown during drag operations.
 * Renders dotted column guides and highlights the active drop zone.
 */
export function GridOverlay({ visible, activeColumn, activeColSpan }: GridOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 0,
      }}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const isActive =
          activeColumn !== undefined &&
          activeColSpan !== undefined &&
          i >= activeColumn &&
          i < activeColumn + activeColSpan;

        return (
          <div
            key={i}
            className={cn(
              'border-r border-dashed border-primary/10 h-full transition-colors duration-150',
              i === 0 && 'border-l',
              isActive && 'bg-primary/5'
            )}
          />
        );
      })}
    </div>
  );
}
