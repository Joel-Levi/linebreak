import type { FontKey, LineConfig, Preset, RevealMode, SolidTheme } from './types';

export const FONT_MAP: Record<FontKey, string> = {
  serif: '"Fraunces", Georgia, serif',
  sans: '"Space Grotesk", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  hand: '"Caveat", cursive',
};

export const FONT_LABELS: Record<FontKey, string> = {
  serif: 'Serif',
  sans: 'Sans',
  mono: 'Mono',
  hand: 'Hand',
};

export const FONT_ORDER: FontKey[] = ['serif', 'sans', 'mono', 'hand'];

export const HUE_OPTIONS: { name: string; hue: number }[] = [
  { name: 'Rose', hue: 15 },
  { name: 'Amber', hue: 68 },
  { name: 'Meadow', hue: 140 },
  { name: 'Teal', hue: 195 },
  { name: 'Sky', hue: 232 },
  { name: 'Violet', hue: 288 },
];

// Solid, non-animated background themes chosen for strong, dependable contrast —
// an alternative to the animated gradient hues for readers who want a plain,
// predictable background (low vision, light sensitivity, motion sensitivity).
export const SOLID_THEMES: SolidTheme[] = [
  { id: 'high-contrast-light', name: 'High contrast (light)', pageBg: '#ffffff', text: '#000000', sub: '#4d4d4d', isLight: true },
  { id: 'high-contrast-dark', name: 'High contrast (dark)', pageBg: '#000000', text: '#ffffff', sub: '#cfcfcf', isLight: false },
  { id: 'soft-dark', name: 'Soft dark', pageBg: '#1b1f24', text: '#e8e6e3', sub: '#a8a49d', isLight: false },
  { id: 'sepia', name: 'Sepia', pageBg: '#f4ecd8', text: '#3b2f1e', sub: '#6b5a3e', isLight: true },
  { id: 'yellow-on-black', name: 'Yellow on black', pageBg: '#000000', text: '#ffde59', sub: '#c9ad3f', isLight: false },
];

export const MODE_OPTIONS: { key: RevealMode; label: string }[] = [
  { key: 'whole', label: 'Whole line' },
  { key: 'word', label: 'Word by word' },
  { key: 'split', label: 'Build to word' },
];

export const PRESET_OPTIONS: { key: Preset; label: string }[] = [
  { key: 'line', label: 'Line by line' },
  { key: 'word', label: 'Word by word' },
  { key: 'advanced', label: 'Advanced' },
];

export const DEFAULT_TEXT = '';

export function defaultConfig(): LineConfig {
  return { mode: 'whole', breakIndex: null, mergeNext: false };
}

export const DEFAULT_CONFIGS: LineConfig[] = [];
