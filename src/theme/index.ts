import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#F5EFE4',
  surface: '#FFFDF8',
  ink: '#2A2420',
  inkMuted: '#7C7267',
  terracotta: '#C15F3C',
  moss: '#6E7F5C',
  gold: '#C99A3E',
  border: '#E4D9C7',
  miss: '#B15347',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 14,
  md: 16,
} as const;

// Font files to hand to useFonts() before rendering anything that uses `type`.
export const fontsToLoad = {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
};

type TypeToken = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

export const type: Record<
  'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMuted' | 'label' | 'button' | 'caption',
  TypeToken
> = {
  display: { fontFamily: 'Fraunces_700Bold', fontSize: 40, lineHeight: 46 },
  h1: { fontFamily: 'Fraunces_600SemiBold', fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: 'Fraunces_600SemiBold', fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: 'Fraunces_500Medium', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMuted: { fontFamily: 'Manrope_400Regular', fontSize: 16, lineHeight: 24 },
  label: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, lineHeight: 18, letterSpacing: 0.4 },
  button: { fontFamily: 'Manrope_700Bold', fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: 'Manrope_400Regular', fontSize: 12, lineHeight: 16 },
};

export const theme = { colors, spacing, radius, type };

export type Theme = typeof theme;
