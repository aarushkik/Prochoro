import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { deviceStorage } from '@/lib/storage';
import { createSaveQueue } from '@/lib/saveQueue';
import { colors as lightColors, darkColors, palette, darkPalette, type ThemeColors } from './colors';
import { makeTypography } from './typography';
import { chunky as makeChunky, type ChunkyOptions } from './chunky';
import { stroke } from './stroke';
import { darkGlass, glassCard, lightGlass, solidGlass } from './glass';
import { useReducedTransparency } from '@/hooks/useReducedTransparency';
import { resolveAppearance, type AppearancePreference } from './appearance';
export type { AppearancePreference } from './appearance';

function makeTheme(mode: 'light' | 'dark', solid: boolean) {
  const colors: ThemeColors = mode === 'dark' ? darkColors : lightColors;
  const base = mode === 'dark' ? darkGlass : lightGlass;
  const glass = solid ? solidGlass(base, colors) : base;
  return {
    mode, isDark: mode === 'dark', colors, palette: mode === 'dark' ? darkPalette : palette, stroke,
    /** True under Reduce Transparency: glass tokens are opaque. */
    solid,
    typography: makeTypography(colors),
    chunky: (options?: ChunkyOptions) => makeChunky(options, colors, glass),
    glass,
    /** A content card's face. See `glassCard`. */
    card: glassCard(glass),
  };
}
export type AppTheme = ReturnType<typeof makeTheme>;
const themes = {
  light: { glass: makeTheme('light', false), solid: makeTheme('light', true) },
  dark: { glass: makeTheme('dark', false), solid: makeTheme('dark', true) },
};
const ThemeContext = createContext(themes.light.glass);
const PreferenceContext = createContext({ preference: 'system' as AppearancePreference, setPreference: (_: AppearancePreference) => {}, error: null as string | null });
const KEY = 'studyplat.appearance';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const reduceTransparency = useReducedTransparency();
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [error, setError] = useState<string | null>(null);
  const changed = useRef(false);
  const saves = useMemo(() => createSaveQueue<string>((value) => deviceStorage.setItem(KEY, value)), []);
  useEffect(() => {
    let alive = true;
    void deviceStorage.getItem(KEY).then((saved) => {
      if (alive && !changed.current && (saved === 'system' || saved === 'light' || saved === 'dark')) setPreferenceState(saved);
    }).catch(() => { if (alive) setError('Your saved appearance could not be loaded.'); });
    return () => { alive = false; };
  }, []);
  const setPreference = useCallback((next: AppearancePreference) => {
    changed.current = true;
    setPreferenceState(next);
    setError(null);
    void saves.save(next).catch(() => setError('Appearance changed for now. Tap your choice again to retry saving it.'));
  }, [saves]);
  const controls = useMemo(() => ({ preference, setPreference, error }), [preference, setPreference, error]);
  return <PreferenceContext.Provider value={controls}><ThemeContext.Provider value={themes[resolveAppearance(preference, system)][reduceTransparency ? 'solid' : 'glass']}>{children}</ThemeContext.Provider></PreferenceContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);
export const useAppearancePreference = () => useContext(PreferenceContext);
/** Style factories run once per theme; switching appearance never remounts a screen. */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
