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

export interface Colors {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  pageBg: string;
  text: string;
  sub: string;
  isLight: boolean;
}

export interface Blob {
  style: Partial<CSSStyleDeclaration>;
  miniStyle: Partial<CSSStyleDeclaration>;
}

export interface SolidTheme {
  id: string;
  name: string;
  pageBg: string;
  text: string;
  sub: string;
  isLight: boolean;
}
