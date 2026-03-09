import { TextStyle } from 'react-native';

export const colors = {
  background: '#0f0f1a',
  card: '#1a1a2e',
  cardLight: '#232340',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  accent: '#6c63ff',
  accentLight: '#8b83ff',
  secondary: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#2d2d4a',
  success: '#22c55e',
  inputBg: '#16162b',
};

export const typography: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  small: { fontSize: 11, fontWeight: '400' },
};
