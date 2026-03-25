/**
 * ThemeLockPanel - Toggle locks for individual design layers
 *
 * When a layer is locked, switching theme presets will preserve
 * the current values for that layer while updating unlocked layers.
 *
 * @module admin/components
 */

import { Lock, Unlock, Palette, Type, Maximize, Sparkles, LayoutGrid } from 'lucide-react';
import { Button, cn } from '@netrun-cms/ui';
import type { ThemeLockState } from '@netrun-cms/core';

export interface ThemeLockPanelProps {
  locks: ThemeLockState;
  onLocksChange: (locks: ThemeLockState) => void;
  disabled?: boolean;
}

const lockLayers: { key: keyof ThemeLockState; label: string; icon: typeof Palette }[] = [
  { key: 'colors', label: 'Colors', icon: Palette },
  { key: 'typography', label: 'Typography', icon: Type },
  { key: 'spacing', label: 'Spacing', icon: Maximize },
  { key: 'effects', label: 'Effects', icon: Sparkles },
  { key: 'blockDefaults', label: 'Layout', icon: LayoutGrid },
];

export function ThemeLockPanel({ locks, onLocksChange, disabled }: ThemeLockPanelProps) {
  const toggleLock = (key: keyof ThemeLockState) => {
    onLocksChange({ ...locks, [key]: !locks[key] });
  };

  const lockedCount = Object.values(locks).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Design Locks
          {lockedCount > 0 && (
            <span className="ml-1.5 text-xs text-primary">
              ({lockedCount} locked)
            </span>
          )}
        </p>
        {lockedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() =>
              onLocksChange({
                colors: false,
                typography: false,
                spacing: false,
                effects: false,
                blockDefaults: false,
              })
            }
            disabled={disabled}
          >
            Unlock All
          </Button>
        )}
      </div>
      <div className="flex gap-1.5">
        {lockLayers.map(({ key, label, icon: Icon }) => {
          const isLocked = locks[key];
          return (
            <Button
              key={key}
              variant={isLocked ? 'secondary' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 gap-1.5 text-xs h-9 transition-all',
                isLocked && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15',
                !isLocked && 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => toggleLock(key)}
              disabled={disabled}
              title={isLocked ? `Unlock ${label} — will update when switching presets` : `Lock ${label} — preserve when switching presets`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {isLocked ? (
                <Lock className="h-3 w-3 ml-auto" />
              ) : (
                <Unlock className="h-3 w-3 ml-auto opacity-40" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeLockPanel;
