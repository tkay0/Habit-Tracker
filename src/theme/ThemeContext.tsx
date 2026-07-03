import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getProfile, setThemeMode as persistThemeMode } from '../db/profile';
import type { ThemeMode } from '../db/types';
import { darkColors, lightColors, type ColorPalette } from './palettes';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile().then((profile) => {
      if (cancelled || !profile) return;
      setModeState(profile.themeMode);
      setProfileId(profile.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      if (profileId) void persistThemeMode(profileId, next);
    },
    [profileId]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: mode === 'dark' ? darkColors : lightColors, setMode }),
    [mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
