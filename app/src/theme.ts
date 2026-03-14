import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Backgrounds
  background: '#0a0a14',
  card: '#14142a',
  cardLight: '#1e1e3a',
  cardElevated: '#1a1a35',
  inputBg: '#12122a',

  // Text
  text: '#f0f0f5',
  textSecondary: '#8888a8',
  textMuted: '#555570',

  // Primary accent (vibrant blue-purple)
  accent: '#7c6cff',
  accentLight: '#9d8fff',
  accentDim: 'rgba(124, 108, 255, 0.12)',
  accentSoft: 'rgba(124, 108, 255, 0.25)',

  // Status colors
  secondary: '#34d399',     // emerald green
  secondaryDim: 'rgba(52, 211, 153, 0.12)',
  warning: '#fbbf24',
  warningDim: 'rgba(251, 191, 36, 0.12)',
  danger: '#f87171',
  dangerDim: 'rgba(248, 113, 113, 0.12)',
  success: '#34d399',

  // Borders & dividers
  border: '#252545',
  borderLight: '#303060',

  // Gradients
  gradientStart: '#7c6cff',
  gradientEnd: '#4f46e5',
  gradientWarm: '#f59e0b',
  gradientCool: '#06b6d4',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const typography: Record<string, TextStyle> = {
  hero: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  captionBold: { fontSize: 13, fontWeight: '600' },
  small: { fontSize: 11, fontWeight: '400' },
  smallBold: { fontSize: 11, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadows: Record<string, ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
