import type { BackgroundTheme, FontKey, LineConfig, Preset, RevealMode } from './types';

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
// predictable background (low vision, light sensitivity, motion sensitivity) —
// plus a handful of fun, distinctly-different animated presets (patterns.ts)
// alongside them. All share one list/id-space/state slot since they're all
// mutually exclusive alternatives to the gradient-hue background.
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'high-contrast-light', name: 'High contrast (light)', pattern: 'none', pageBg: '#ffffff', text: '#000000', sub: '#4d4d4d', isLight: true },
  { id: 'high-contrast-dark', name: 'High contrast (dark)', pattern: 'none', pageBg: '#000000', text: '#ffffff', sub: '#cfcfcf', isLight: false },
  { id: 'soft-dark', name: 'Soft dark', pattern: 'none', pageBg: '#1b1f24', text: '#e8e6e3', sub: '#a8a49d', isLight: false },
  { id: 'sepia', name: 'Sepia', pattern: 'none', pageBg: '#f4ecd8', text: '#3b2f1e', sub: '#6b5a3e', isLight: true },
  { id: 'yellow-on-black', name: 'Yellow on black', pattern: 'none', pageBg: '#000000', text: '#ffde59', sub: '#c9ad3f', isLight: false },
  {
    id: 'aurora',
    name: 'Aurora',
    pattern: 'aurora',
    pageBg: '#0b1220',
    text: '#eef3fb',
    sub: '#b9c2e0',
    isLight: false,
    colors: ['#2dd4bf', '#22c55e', '#a78bfa', '#f472b6'],
  },
  {
    id: 'starfield',
    name: 'Starfield',
    pattern: 'starfield',
    pageBg: '#05060f',
    text: '#f5f7ff',
    sub: '#9aa3c7',
    isLight: false,
    colors: ['#ffffff', '#cfe0ff', '#ffe9b3', '#ffffff'],
  },
  {
    id: 'confetti',
    name: 'Confetti',
    pattern: 'confetti',
    pageBg: '#fff8f0',
    text: '#241a12',
    sub: '#6b5a4a',
    isLight: true,
    colors: ['#ff6b6b', '#ffd93d', '#4ecdc4', '#a78bfa'],
  },
  {
    id: 'ripple',
    name: 'Ripple',
    pattern: 'ripple',
    pageBg: '#0d2b3a',
    text: '#eaf6fa',
    sub: '#9fc9d6',
    isLight: false,
    colors: ['#7dd3fc', '#38bdf8', '#0ea5e9', '#e0f2fe'],
  },
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
