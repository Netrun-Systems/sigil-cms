/**
 * useThemeWithLocks - Lock-aware theme application hook
 *
 * Manages lock state for design layers. When applying a new preset,
 * locked layers retain their current values while unlocked layers
 * update to the new preset's values.
 *
 * @module admin/hooks
 */
import type { ThemeTokens, ThemeLockState } from '@netrun-cms/core';
import type { ThemePreset, ThemeBlockDefaults } from '@netrun-cms/theme';
export interface ThemeWithLocksState {
    locks: ThemeLockState;
    setLocks: (locks: ThemeLockState) => void;
    currentTokens: ThemeTokens | null;
    currentBlockDefaults: ThemeBlockDefaults | null;
    applyPreset: (preset: ThemePreset, mode: 'dark' | 'light') => ThemeTokens;
    setCurrentTokens: (tokens: ThemeTokens) => void;
}
export declare function useThemeWithLocks(): ThemeWithLocksState;
export default useThemeWithLocks;
//# sourceMappingURL=useThemeWithLocks.d.ts.map