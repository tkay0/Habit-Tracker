export const lightColors = {
  bg: '#F5EFE4',
  surface: '#FFFDF8',
  ink: '#2A2420',
  inkMuted: '#7C7267',
  terracotta: '#C15F3C',
  moss: '#6E7F5C',
  gold: '#C99A3E',
  border: '#E4D9C7',
  miss: '#B15347',
  slate: '#5B7C99',
  plum: '#8B5A7C',
} as const;

// Same warm palette, inverted for a dark background: neutrals flip (near-black
// bg, warm off-white ink), accents are lightened a touch so they keep enough
// contrast against the dark surface instead of looking muddy.
export const darkColors = {
  bg: '#1C1815',
  surface: '#272019',
  ink: '#F1E9DD',
  inkMuted: '#A79C8C',
  terracotta: '#E2825A',
  moss: '#8FAE78',
  gold: '#E3BC6E',
  border: '#3D362C',
  miss: '#DC8578',
  slate: '#84AACB',
  plum: '#B98BAA',
} as const;

export type ColorPalette = Record<keyof typeof lightColors, string>;
