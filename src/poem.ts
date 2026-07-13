import { deflateSync, inflateSync } from 'fflate';
import { FONT_ORDER, MODE_OPTIONS, SOLID_THEMES, defaultConfig } from './constants';
import type { FontKey, LineConfig, PoemPayload, Reveal, RevealLine } from './types';

export function computeReveal(rawLines: string[], configs: LineConfig[]): Reveal {
  let step = 0;
  const built: RevealLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    if (trimmed === '') {
      built.push({ blank: true, words: [] });
      continue;
    }
    const cfg = configs[i] || defaultConfig();
    const words = trimmed.split(/\s+/);
    const steps: number[] = [];

    // preserve the poem's original spacing (indentation, doubled spaces) when
    // rendering — `words`/`trimmed` above are only used to count/index words.
    const leading = raw.match(/^\s*/)?.[0] ?? '';
    const tokens = trimmed.split(/(\s+)/);
    const displayTexts = words.map((_, idx) => {
      const gap = tokens[idx * 2 + 1] ?? '';
      const text = tokens[idx * 2] + gap;
      return idx === 0 ? leading + text : text;
    });

    if (cfg.mode === 'word') {
      for (let w = 0; w < words.length; w++) {
        steps.push(step);
        if (w < words.length - 1) step++;
      }
      if (!cfg.mergeNext) step++;
    } else if (cfg.mode === 'split') {
      let bi = cfg.breakIndex;
      if (bi == null || bi < 0 || bi >= words.length - 1) {
        bi = Math.max(0, Math.floor((words.length - 1) / 2));
      }
      const s1 = step;
      step++;
      const s2 = step;
      for (let w = 0; w < words.length; w++) steps.push(w <= bi ? s1 : s2);
      if (!cfg.mergeNext) step++;
    } else {
      const s = step;
      for (let w = 0; w < words.length; w++) steps.push(s);
      if (!cfg.mergeNext) step++;
    }

    built.push({
      blank: false,
      words: words.map((_, idx) => ({ text: displayTexts[idx], step: steps[idx] })),
    });
  }

  let maxStep = 0;
  built.forEach((l) => {
    if (!l.blank) l.words.forEach((w) => { if (w.step > maxStep) maxStep = w.step; });
  });

  return { lines: built, totalSteps: maxStep + 1 };
}

// Wire format for share links: a positional (not keyed) array — no repeated
// `"lineConfigs":`/`"breakIndex":`-style property names — then deflated and
// base64'd. Line configs that match the default are stored as `null` rather
// than a full tuple, since most lines in a typical poem don't customize their
// reveal. None of this needs to stay backward-compatible: an older link that
// predates this format simply fails to decode and falls back to the default
// poem (see decodePoem's catch-all below), it doesn't crash.
const MODE_CODES = MODE_OPTIONS.map((m) => m.key);

type CompactLineConfig = [number, number | null, 0 | 1] | null;
type CompactPayload = [
  title: string,
  text: string,
  lineConfigs: CompactLineConfig[],
  fontIndex: number,
  hue: number,
  author: string,
  solidThemeIndex: number, // -1 = none
];

function encodeLineConfig(cfg: LineConfig): CompactLineConfig {
  if (cfg.mode === 'whole' && cfg.breakIndex === null && !cfg.mergeNext) return null;
  return [MODE_CODES.indexOf(cfg.mode), cfg.breakIndex, cfg.mergeNext ? 1 : 0];
}

function decodeLineConfig(c: CompactLineConfig): LineConfig {
  if (c === null) return defaultConfig();
  const [modeIndex, breakIndex, merge] = c;
  return { mode: MODE_CODES[modeIndex] ?? 'whole', breakIndex, mergeNext: merge === 1 };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(str: string): Uint8Array {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodePoem(obj: PoemPayload): string {
  const compact: CompactPayload = [
    obj.title,
    obj.text,
    obj.lineConfigs.map(encodeLineConfig),
    Math.max(0, FONT_ORDER.indexOf(obj.font)),
    obj.hue,
    obj.author,
    obj.solidTheme ? SOLID_THEMES.findIndex((t) => t.id === obj.solidTheme) : -1,
  ];
  const json = JSON.stringify(compact);
  const compressed = deflateSync(new TextEncoder().encode(json));
  return bytesToBase64(compressed);
}

export function decodePoem(str: string): PoemPayload | null {
  try {
    const compressed = base64ToBytes(str);
    const json = new TextDecoder().decode(inflateSync(compressed));
    const [title, text, lineConfigs, fontIndex, hue, author, solidThemeIndex] = JSON.parse(json) as CompactPayload;
    return {
      title,
      text,
      lineConfigs: lineConfigs.map(decodeLineConfig),
      font: (FONT_ORDER[fontIndex] as FontKey | undefined) ?? 'serif',
      hue,
      author,
      solidTheme: solidThemeIndex >= 0 ? (SOLID_THEMES[solidThemeIndex]?.id ?? null) : null,
    };
  } catch {
    return null;
  }
}
