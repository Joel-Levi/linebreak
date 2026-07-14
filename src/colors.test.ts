import { describe, expect, it } from 'vitest';
import { accentColors, makeBlobs, oklch, resolveColors } from './colors';
import { BACKGROUND_THEMES } from './constants';
import { makeAurora, makeConfetti, makeDecorations, makeRipple, makeStarfield } from './patterns';

describe('oklch', () => {
  it('formats an oklch() CSS string', () => {
    expect(oklch(58, 0.2, 195)).toBe('oklch(58% 0.2 195)');
  });

  it('wraps negative hues into 0-360', () => {
    expect(oklch(50, 0.1, -10)).toBe('oklch(50% 0.1 350)');
  });

  it('wraps hues above 360 back into range', () => {
    expect(oklch(50, 0.1, 370)).toBe('oklch(50% 0.1 10)');
    expect(oklch(50, 0.1, 720)).toBe('oklch(50% 0.1 0)');
  });
});

describe('accentColors', () => {
  it('returns a low-chroma, light palette in accessible (a11y) mode', () => {
    const colors = accentColors(195, true);
    expect(colors.pageBg).toContain('98%');
    expect(colors.text).toContain('16%');
    // chroma values should all be small/desaturated
    for (const key of ['c1', 'c2', 'c3', 'c4'] as const) {
      expect(colors[key]).toMatch(/oklch\(\d+% 0\.004 /);
    }
  });

  it('returns a saturated, dark-background palette outside a11y mode', () => {
    const colors = accentColors(195, false);
    expect(colors.pageBg).toContain('20%');
    expect(colors.text).toContain('97%');
    expect(colors.c1).toBe('oklch(58% 0.2 195)');
  });

  it('derives blob hues by offsetting from the base hue', () => {
    const colors = accentColors(100, false);
    expect(colors.c2).toBe('oklch(46% 0.21 145)');
    expect(colors.c3).toBe('oklch(66% 0.18 65)');
    expect(colors.c4).toBe('oklch(40% 0.22 115)');
  });

  it('flags a11y mode as a light background and the vivid mode as a dark one', () => {
    expect(accentColors(195, true).isLight).toBe(true);
    expect(accentColors(195, false).isLight).toBe(false);
  });
});

describe('resolveColors', () => {
  it('falls back to the animated gradient palette when no solid theme is set', () => {
    expect(resolveColors(195, false, null)).toEqual(accentColors(195, false));
    expect(resolveColors(195, true, null)).toEqual(accentColors(195, true));
  });

  it('returns a flat palette (all blob slots equal to the page background) for a known solid theme', () => {
    const theme = BACKGROUND_THEMES.find((t) => t.pattern === 'none')!;
    const colors = resolveColors(195, false, theme.id);
    expect(colors).toEqual({
      c1: theme.pageBg,
      c2: theme.pageBg,
      c3: theme.pageBg,
      c4: theme.pageBg,
      pageBg: theme.pageBg,
      text: theme.text,
      sub: theme.sub,
      isLight: theme.isLight,
      pattern: 'none',
    });
  });

  it('maps a fun theme\'s 4 accent colors into c1-c4 and carries its pattern name', () => {
    const theme = BACKGROUND_THEMES.find((t) => t.pattern === 'aurora')!;
    const colors = resolveColors(195, false, theme.id);
    expect([colors.c1, colors.c2, colors.c3, colors.c4]).toEqual(theme.colors);
    expect(colors.pattern).toBe('aurora');
  });

  it('ignores the a11y flag once a special theme is active', () => {
    const theme = BACKGROUND_THEMES[0];
    expect(resolveColors(195, true, theme.id)).toEqual(resolveColors(195, false, theme.id));
  });

  it('falls back to the gradient palette for an unrecognized theme id', () => {
    expect(resolveColors(195, false, 'not-a-real-theme')).toEqual(accentColors(195, false));
  });
});

describe('makeDecorations', () => {
  it('dispatches to blobs for the gradient hue pattern', () => {
    const colors = accentColors(195, false);
    expect(makeDecorations(colors)).toEqual(makeBlobs(colors));
  });

  it('returns nothing for a flat (non-animated) solid theme', () => {
    const theme = BACKGROUND_THEMES.find((t) => t.pattern === 'none')!;
    const colors = resolveColors(195, false, theme.id);
    expect(makeDecorations(colors)).toEqual([]);
  });

  it('dispatches each fun theme to its own generator', () => {
    const cases: [string, (c: ReturnType<typeof resolveColors>) => unknown][] = [
      ['aurora', makeAurora],
      ['starfield', makeStarfield],
      ['confetti', makeConfetti],
      ['ripple', makeRipple],
    ];
    for (const [pattern, generator] of cases) {
      const theme = BACKGROUND_THEMES.find((t) => t.pattern === pattern)!;
      const colors = resolveColors(195, false, theme.id);
      expect(makeDecorations(colors).length).toBe((generator(colors) as unknown[]).length);
    }
  });
});

describe('makeBlobs', () => {
  const colors = accentColors(195, false);
  const blobs = makeBlobs(colors);

  it('produces exactly 6 blobs', () => {
    expect(blobs).toHaveLength(6);
  });

  it('gives the full-size style vmax units and a soft radial-gradient glow instead of a blur filter', () => {
    for (const blob of blobs) {
      expect(blob.style.width).toMatch(/^\d+vmax$/);
      expect(blob.style.filter).toBeUndefined();
      // "closest-side" (not the default farthest-corner) so a square box still
      // fades out as a clean circle instead of bleeding solid color to the edges
      expect(blob.style.background).toMatch(/^radial-gradient\(circle closest-side, /);
      // the gradient must fade to a transparent version of the same color, not a hard cutoff
      expect(blob.style.background).toMatch(/\/ 0\)\s*100%\)$/);
    }
  });

  it('gives the mini style pixel units and keeps the same gradient/animation, just smaller', () => {
    for (const blob of blobs) {
      expect(blob.miniStyle.width).toMatch(/^\d+(\.\d+)?px$/);
      expect(blob.miniStyle.filter).toBeUndefined();
      expect(blob.miniStyle.background).toBe(blob.style.background);
      expect(blob.miniStyle.animationName).toBe(blob.style.animationName);
    }
  });

  it('pins the full-size blob to the viewport (fixed), not the growing page (absolute)', () => {
    for (const blob of blobs) {
      expect(blob.style.position).toBe('fixed');
    }
  });

  it('keeps the mini preview-strip blob confined to its own small box (absolute)', () => {
    for (const blob of blobs) {
      expect(blob.miniStyle.position).toBe('absolute');
    }
  });
});
