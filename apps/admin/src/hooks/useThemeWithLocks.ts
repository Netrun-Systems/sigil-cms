/**
 * useThemeWithLocks - Lock-aware theme application hook
 *
 * Manages lock state for design layers. When applying a new preset,
 * locked layers retain their current values while unlocked layers
 * update to the new preset's values.
 *
 * @module admin/hooks
 */

import { useState, useCallback } from 'react';
import type { ThemeTokens, ThemeLockState } from '@netrun-cms/core';
import { DEFAULT_THEME_LOCKS } from '@netrun-cms/core';
import type { ThemePreset, ThemeBlockDefaults } from '@netrun-cms/theme';

export interface ThemeWithLocksState {
  locks: ThemeLockState;
  setLocks: (locks: ThemeLockState) => void;
  currentTokens: ThemeTokens | null;
  currentBlockDefaults: ThemeBlockDefaults | null;
  applyPreset: (preset: ThemePreset, mode: 'dark' | 'light') => ThemeTokens;
  setCurrentTokens: (tokens: ThemeTokens) => void;
}

export function useThemeWithLocks(): ThemeWithLocksState {
  const [locks, setLocks] = useState<ThemeLockState>(DEFAULT_THEME_LOCKS);
  const [currentTokens, setCurrentTokens] = useState<ThemeTokens | null>(null);
  const [currentBlockDefaults, setCurrentBlockDefaults] = useState<ThemeBlockDefaults | null>(null);

  const applyPreset = useCallback(
    (preset: ThemePreset, mode: 'dark' | 'light'): ThemeTokens => {
      const newTokens = mode === 'dark' ? preset.darkTokens : preset.lightTokens;

      let result: ThemeTokens;

      if (!currentTokens) {
        // First application, no locks apply
        result = newTokens;
      } else {
        result = {
          colors: locks.colors ? currentTokens.colors : newTokens.colors,
          typography: locks.typography ? currentTokens.typography : newTokens.typography,
          spacing: locks.spacing ? currentTokens.spacing : newTokens.spacing,
          effects: locks.effects ? currentTokens.effects : newTokens.effects,
        };
      }

      setCurrentTokens(result);

      setCurrentBlockDefaults((prev) => {
        if (locks.blockDefaults && prev) return prev;
        return preset.blockDefaults || null;
      });

      return result;
    },
    [locks, currentTokens]
  );

  return {
    locks,
    setLocks,
    currentTokens,
    currentBlockDefaults,
    applyPreset,
    setCurrentTokens,
  };
}

export default useThemeWithLocks;
