/**
 * ThemeLockPanel - Toggle locks for individual design layers
 *
 * When a layer is locked, switching theme presets will preserve
 * the current values for that layer while updating unlocked layers.
 *
 * @module admin/components
 */
import type { ThemeLockState } from '@netrun-cms/core';
export interface ThemeLockPanelProps {
    locks: ThemeLockState;
    onLocksChange: (locks: ThemeLockState) => void;
    disabled?: boolean;
}
export declare function ThemeLockPanel({ locks, onLocksChange, disabled }: ThemeLockPanelProps): import("react/jsx-runtime").JSX.Element;
export default ThemeLockPanel;
//# sourceMappingURL=ThemeLockPanel.d.ts.map