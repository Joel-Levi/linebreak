import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIGS,
  DEFAULT_TEXT,
  FONT_LABELS,
  FONT_MAP,
  FONT_ORDER,
  HUE_OPTIONS,
  MODE_OPTIONS,
  PRESET_OPTIONS,
  BACKGROUND_THEMES,
  defaultConfig,
} from './constants';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexToRgb(hexA));
  const l2 = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('defaultConfig', () => {
  it('returns a whole-line, unmerged, no-break-index config', () => {
    expect(defaultConfig()).toEqual({ mode: 'whole', breakIndex: null, mergeNext: false });
  });

  it('returns a fresh object every call so callers cannot share/mutate one instance', () => {
    expect(defaultConfig()).not.toBe(defaultConfig());
  });
});

describe('DEFAULT_CONFIGS / DEFAULT_TEXT alignment', () => {
  it('starts the poem blank, with no per-line configs to match', () => {
    expect(DEFAULT_TEXT).toBe('');
    expect(DEFAULT_CONFIGS).toEqual([]);
  });
});

describe('font data', () => {
  it('FONT_ORDER lists exactly the keys present in FONT_MAP and FONT_LABELS', () => {
    const mapKeys = Object.keys(FONT_MAP).sort();
    const labelKeys = Object.keys(FONT_LABELS).sort();
    expect([...FONT_ORDER].sort()).toEqual(mapKeys);
    expect([...FONT_ORDER].sort()).toEqual(labelKeys);
  });

  it('has no duplicate fonts', () => {
    expect(new Set(FONT_ORDER).size).toBe(FONT_ORDER.length);
  });
});

describe('HUE_OPTIONS', () => {
  it('keeps every hue within 0-359 and unique', () => {
    const hues = HUE_OPTIONS.map((h) => h.hue);
    for (const hue of hues) {
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
    expect(new Set(hues).size).toBe(hues.length);
  });

  it('has no duplicate names', () => {
    const names = HUE_OPTIONS.map((h) => h.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('BACKGROUND_THEMES', () => {
  it('has unique ids and names', () => {
    expect(new Set(BACKGROUND_THEMES.map((t) => t.id)).size).toBe(BACKGROUND_THEMES.length);
    expect(new Set(BACKGROUND_THEMES.map((t) => t.name)).size).toBe(BACKGROUND_THEMES.length);
  });

  it('meets WCAG AA contrast (>=4.5:1) for main text against its background', () => {
    for (const theme of BACKGROUND_THEMES) {
      expect(contrastRatio(theme.pageBg, theme.text)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('meets WCAG AA contrast (>=4.5:1) for secondary/sub text against its background', () => {
    for (const theme of BACKGROUND_THEMES) {
      expect(contrastRatio(theme.pageBg, theme.sub)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('flags isLight consistently with the background\'s actual luminance', () => {
    for (const theme of BACKGROUND_THEMES) {
      const isActuallyLight = relativeLuminance(hexToRgb(theme.pageBg)) > 0.5;
      expect(theme.isLight).toBe(isActuallyLight);
    }
  });

  it('gives every animated (non-"none") theme exactly 4 accent colors', () => {
    for (const theme of BACKGROUND_THEMES) {
      if (theme.pattern === 'none') {
        expect(theme.colors).toBeUndefined();
      } else {
        expect(theme.colors).toHaveLength(4);
      }
    }
  });
});

describe('MODE_OPTIONS / PRESET_OPTIONS', () => {
  it('covers exactly the whole/word/split reveal modes', () => {
    expect(MODE_OPTIONS.map((m) => m.key)).toEqual(['whole', 'word', 'split']);
  });

  it('covers exactly the line/word/advanced presets', () => {
    expect(PRESET_OPTIONS.map((p) => p.key)).toEqual(['line', 'word', 'advanced']);
  });
});
