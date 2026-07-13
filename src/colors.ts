import { SOLID_THEMES } from './constants';
import type { Blob, Colors } from './types';

export function oklch(l: number, c: number, h: number): string {
  return `oklch(${l}% ${c} ${((h % 360) + 360) % 360})`;
}

export function accentColors(hue: number, a11y: boolean): Colors {
  if (a11y) {
    return {
      c1: oklch(97, 0.004, hue),
      c2: oklch(95, 0.004, hue),
      c3: oklch(93, 0.004, hue),
      c4: oklch(91, 0.004, hue),
      pageBg: oklch(98, 0.003, hue),
      text: oklch(16, 0.01, hue),
      sub: oklch(38, 0.01, hue),
      isLight: true,
    };
  }
  return {
    c1: oklch(58, 0.2, hue),
    c2: oklch(46, 0.21, hue + 45),
    c3: oklch(66, 0.18, hue - 35),
    c4: oklch(40, 0.22, hue + 15),
    pageBg: oklch(20, 0.055, hue),
    text: oklch(97, 0.015, hue),
    sub: oklch(82, 0.03, hue),
    isLight: false,
  };
}

// Resolves the active background: a chosen solid a11y theme takes priority
// over the animated gradient hue, falling back to it when unset/unknown.
export function resolveColors(hue: number, a11y: boolean, solidThemeId: string | null): Colors {
  if (solidThemeId) {
    const theme = SOLID_THEMES.find((t) => t.id === solidThemeId);
    if (theme) {
      return {
        c1: theme.pageBg,
        c2: theme.pageBg,
        c3: theme.pageBg,
        c4: theme.pageBg,
        pageBg: theme.pageBg,
        text: theme.text,
        sub: theme.sub,
        isLight: theme.isLight,
      };
    }
  }
  return accentColors(hue, a11y);
}

// A soft-edged radial gradient reads as the same glowing blob as a blurred
// solid circle, but is just a cheap fill for the GPU — no blur filter (an
// expensive convolution pass) needed. Mobile GPUs in particular struggle with
// several large, continuously-animated `filter: blur()` layers at once.
function glow(color: string): string {
  const transparent = color.replace(/\)\s*$/, ' / 0)');
  return `radial-gradient(circle closest-side, ${color} 0%, ${color} 55%, ${transparent} 100%)`;
}

export function makeBlobs(colors: Colors): Blob[] {
  const defs = [
    { top: '-25%', left: '-20%', size: 105, color: colors.c1, anim: 'lbBlobA', dur: 20 },
    { top: '-5%', left: '45%', size: 100, color: colors.c2, anim: 'lbBlobB', dur: 24 },
    { top: '40%', left: '-18%', size: 95, color: colors.c3, anim: 'lbBlobC', dur: 22 },
    { top: '45%', left: '40%', size: 102, color: colors.c4, anim: 'lbBlobD', dur: 26 },
    { top: '15%', left: '10%', size: 80, color: colors.c2, anim: 'lbBlobC', dur: 28 },
    { top: '60%', left: '65%', size: 85, color: colors.c1, anim: 'lbBlobB', dur: 22 },
  ];
  return defs.map((d) => {
    const style: Partial<CSSStyleDeclaration> = {
      // fixed (not absolute) so the blobs are pinned to the viewport and stay
      // put as the page grows/scrolls with a long poem, instead of being
      // positioned against the ever-taller reader container
      position: 'fixed',
      zIndex: '0',
      top: d.top,
      left: d.left,
      width: `${d.size}vmax`,
      height: `${d.size}vmax`,
      background: glow(d.color),
      opacity: '0.9',
      animationName: d.anim,
      animationDuration: `${d.dur}s`,
      willChange: 'transform',
      pointerEvents: 'none',
    };
    const miniStyle: Partial<CSSStyleDeclaration> = {
      ...style,
      // the editor's small preview strip still wants the blob confined to
      // that little box, not pinned to the whole viewport
      position: 'absolute',
      width: `${d.size * 0.5}px`,
      height: `${d.size * 0.5}px`,
    };
    return { style, miniStyle };
  });
}
