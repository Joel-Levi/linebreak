import { makeBlobs } from './colors';
import type { Colors, Decoration } from './types';

// Works for any CSS color syntax (hex, oklch, named...), unlike a
// string-replace trick tied to one specific function format.
function transparentize(color: string): string {
  return `color-mix(in srgb, ${color} 0%, transparent)`;
}

// Wide, softly-edged glowing bands that slowly drift and tilt — like the
// northern lights. Blend mode "screen" makes overlapping bands brighten each
// other instead of just muddying into gray.
export function makeAurora(colors: Colors): Decoration[] {
  const bandColors = [colors.c1, colors.c2, colors.c3];
  const defs = [
    { top: '-14%', left: '-30%', anim: 'lbAuroraA', dur: 32 },
    { top: '18%', left: '-40%', anim: 'lbAuroraB', dur: 38 },
    { top: '48%', left: '-30%', anim: 'lbAuroraC', dur: 44 },
  ];
  return defs.map((d, i) => {
    const color = bandColors[i % bandColors.length];
    const edge = transparentize(color);
    const style: Partial<CSSStyleDeclaration> = {
      position: 'fixed',
      zIndex: '0',
      top: d.top,
      left: d.left,
      width: '170vmax',
      height: '16vmax',
      borderRadius: '50%',
      background: `linear-gradient(90deg, ${edge} 0%, ${color} 48%, ${color} 52%, ${edge} 100%)`,
      opacity: '0.3',
      animationName: d.anim,
      animationDuration: `${d.dur}s`,
      willChange: 'transform',
      pointerEvents: 'none',
      mixBlendMode: 'screen',
    };
    const miniStyle: Partial<CSSStyleDeclaration> = {
      ...style,
      position: 'absolute',
      width: '260%',
      height: '30%',
    };
    return { className: 'lb-aurora', style, miniStyle };
  });
}

// A field of small twinkling dots on a dark background.
export function makeStarfield(colors: Colors): Decoration[] {
  const starColors = [colors.c1, colors.c2, colors.c3, colors.c4];
  const count = 36;
  const decorations: Decoration[] = [];
  for (let i = 0; i < count; i++) {
    const top = `${Math.round(Math.random() * 100)}%`;
    const left = `${Math.round(Math.random() * 100)}%`;
    const size = 1.5 + Math.random() * 2;
    const color = starColors[i % starColors.length];
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * -5; // negative: some start already mid-twinkle, not all in sync
    const style: Partial<CSSStyleDeclaration> = {
      position: 'fixed',
      zIndex: '0',
      top,
      left,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      opacity: '0.2',
      animationName: 'lbTwinkle',
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    };
    const miniStyle: Partial<CSSStyleDeclaration> = {
      ...style,
      position: 'absolute',
      width: `${size * 0.7}px`,
      height: `${size * 0.7}px`,
    };
    decorations.push({ className: 'lb-star', style, miniStyle });
  }
  return decorations;
}

// Small colorful shapes gently tumbling and spinning in place.
export function makeConfetti(colors: Colors): Decoration[] {
  const pieceColors = [colors.c1, colors.c2, colors.c3, colors.c4];
  const count = 22;
  const decorations: Decoration[] = [];
  for (let i = 0; i < count; i++) {
    const top = `${Math.round(Math.random() * 100)}%`;
    const left = `${Math.round(Math.random() * 100)}%`;
    const size = 6 + Math.random() * 8;
    const color = pieceColors[i % pieceColors.length];
    const round = i % 3 === 0;
    const duration = 5 + Math.random() * 6;
    const delay = Math.random() * -10;
    const style: Partial<CSSStyleDeclaration> = {
      position: 'fixed',
      zIndex: '0',
      top,
      left,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: round ? '50%' : '3px',
      background: color,
      opacity: '0.85',
      animationName: 'lbConfettiDrift',
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      pointerEvents: 'none',
    };
    const miniStyle: Partial<CSSStyleDeclaration> = {
      ...style,
      position: 'absolute',
      width: `${size * 0.6}px`,
      height: `${size * 0.6}px`,
    };
    decorations.push({ className: 'lb-confetti', style, miniStyle });
  }
  return decorations;
}

// Concentric rings expanding out from the center and fading, staggered so a
// new one starts as the previous fades — a slow, continuous water ripple.
export function makeRipple(colors: Colors): Decoration[] {
  const ringColors = [colors.c1, colors.c2, colors.c3, colors.c4];
  return ringColors.map((color, i) => {
    const style: Partial<CSSStyleDeclaration> = {
      position: 'fixed',
      zIndex: '0',
      top: '50%',
      left: '50%',
      width: '55vmax',
      height: '55vmax',
      borderRadius: '50%',
      border: `2px solid ${color}`,
      background: 'transparent',
      opacity: '0',
      animationName: 'lbRippleExpand',
      animationDuration: '6s',
      animationDelay: `${i * 1.5}s`,
      pointerEvents: 'none',
    };
    const miniStyle: Partial<CSSStyleDeclaration> = {
      ...style,
      position: 'absolute',
      width: '70%',
      height: '70%',
    };
    return { className: 'lb-ripple', style, miniStyle };
  });
}

// Single entry point reader.ts/editor.ts use — picks the right generator (or
// none) for whatever background is currently active.
export function makeDecorations(colors: Colors): Decoration[] {
  switch (colors.pattern) {
    case 'blobs':
      return makeBlobs(colors);
    case 'aurora':
      return makeAurora(colors);
    case 'starfield':
      return makeStarfield(colors);
    case 'confetti':
      return makeConfetti(colors);
    case 'ripple':
      return makeRipple(colors);
    case 'none':
    default:
      return [];
  }
}
