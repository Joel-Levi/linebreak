export type FontKey = 'serif' | 'sans' | 'mono' | 'hand';
export type RevealMode = 'whole' | 'word' | 'split';
export type Preset = 'line' | 'word' | 'advanced';
export type Route = 'editor' | 'reader';

export interface LineConfig {
  mode: RevealMode;
  breakIndex: number | null;
  mergeNext: boolean;
}

export interface PoemPayload {
  title: string;
  text: string;
  lineConfigs: LineConfig[];
  font: FontKey;
  hue: number;
  author: string;
  solidTheme: string | null;
}

export interface AppState extends PoemPayload {
  route: Route;
  previewMode: boolean;
  a11y: boolean;
  revealPreset: Preset;
  revealedCount: number;
  copied: boolean;
  hasLink: boolean;
  shareUrl: string;
}

export interface RevealWord {
  text: string;
  step: number;
}

export interface RevealLine {
  blank: boolean;
  words: RevealWord[];
}

export interface Reveal {
  lines: RevealLine[];
  totalSteps: number;
}

// 'blobs' is the classic animated gradient look (driven by a hue, see
// accentColors); 'none' is a flat, non-animated background (the a11y solid
// themes); the rest are the fun/decorative animated presets in patterns.ts.
export type BackgroundPattern = 'blobs' | 'none' | 'aurora' | 'starfield' | 'confetti' | 'ripple';

export interface Colors {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  pageBg: string;
  text: string;
  sub: string;
  isLight: boolean;
  pattern: BackgroundPattern;
}

// A single decorative background element (a blob, a star, a confetti piece,
// a ripple ring...). `style` is for the full-viewport reader background;
// `miniStyle` is the same element scaled down for the editor's small preview
// strip. `className` names the CSS animation/reduced-motion rule to apply.
export interface Decoration {
  className: string;
  style: Partial<CSSStyleDeclaration>;
  miniStyle: Partial<CSSStyleDeclaration>;
}

export interface BackgroundTheme {
  id: string;
  name: string;
  pattern: Exclude<BackgroundPattern, 'blobs'>;
  pageBg: string;
  text: string;
  sub: string;
  isLight: boolean;
  // decorative accent colors, mapped into Colors.c1-c4 when resolved — only
  // meaningful for patterns other than 'none'
  colors?: [string, string, string, string];
}
