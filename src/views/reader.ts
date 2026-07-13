import { makeBlobs, resolveColors } from '../colors';
import { FONT_MAP } from '../constants';
import { h } from '../dom';
import { computeReveal } from '../poem';
import type { Colors, FontKey, Reveal } from '../types';
import { backToEditing, handleKeyDown, handleTap, shareThisPoem, startNewPoem, stopClick, toggleA11y } from '../actions';
import { state } from '../state';

const UI_FONT = 'system-ui, -apple-system, sans-serif';

interface ReaderSession {
  rootEl: HTMLElement;
  blobsWrap: HTMLElement;
  progressTrack: HTMLElement;
  progressFill: HTMLElement;
  tapHintEl: HTMLElement;
  titleEl: HTMLElement | null;
  a11yBtn: HTMLButtonElement;
  poemWrap: HTMLElement;
  reveal: Reveal;
  lineEls: (HTMLElement | null)[];
  wordEls: (HTMLElement | null)[][];
  afterWrap: HTMLElement | null;
  authorSignatureEl: HTMLElement | null;
  shareLinkEl: HTMLAnchorElement | null;
}

let session: ReaderSession | null = null;

function lineStyle(font: FontKey, colors: Colors): Partial<CSSStyleDeclaration> {
  return {
    fontFamily: FONT_MAP[font],
    color: colors.text,
    fontSize: 'clamp(24px, 4.2vw, 46px)',
    lineHeight: '1.5',
    fontWeight: font === 'hand' ? '600' : '400',
    textAlign: 'center',
    margin: '0',
    whiteSpace: 'pre-wrap',
  };
}

function applyLineStyle(el: HTMLElement, font: FontKey, colors: Colors): void {
  Object.assign(el.style, lineStyle(font, colors));
}

function insertLineNode(sess: ReaderSession, i: number, node: HTMLElement): void {
  let refNode: HTMLElement | null = null;
  for (let j = i + 1; j < sess.lineEls.length; j++) {
    if (sess.lineEls[j]) {
      refNode = sess.lineEls[j];
      break;
    }
  }
  if (refNode) sess.poemWrap.insertBefore(node, refNode);
  else sess.poemWrap.appendChild(node);
}

function revealNewContent(sess: ReaderSession, font: FontKey, colors: Colors): void {
  const s = state;
  const wordAnim = s.a11y ? 'none' : 'lbWordIn 0.5s ease forwards';

  for (let i = 0; i < sess.reveal.lines.length; i++) {
    const line = sess.reveal.lines[i];
    if (line.blank) continue; // blank spacers are created once at mount

    if (!sess.lineEls[i]) {
      const anyRevealed = line.words.some((w) => w.step < s.revealedCount);
      if (!anyRevealed) continue;
      const node = h('div', { style: lineStyle(font, colors), attrs: { 'data-line': String(i) } });
      insertLineNode(sess, i, node);
      sess.lineEls[i] = node;
      sess.wordEls[i] = new Array(line.words.length).fill(null);
    }

    const lineEl = sess.lineEls[i]!;
    for (let wi = 0; wi < line.words.length; wi++) {
      if (sess.wordEls[i][wi]) continue;
      const w = line.words[wi];
      if (w.step < s.revealedCount) {
        const span = h('span', { style: { display: 'inline-block', animation: wordAnim } }, [w.text]);
        lineEl.appendChild(span);
        sess.wordEls[i][wi] = span;
      }
    }
  }
}

function ensureAfterSection(sess: ReaderSession, colors: Colors, font: FontKey): void {
  const s = state;
  const allRevealed = s.revealedCount >= sess.reveal.totalSteps;
  if (!allRevealed || sess.afterWrap) return;

  const afterLinksStyle: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    zIndex: '2',
    marginTop: '36px',
    display: 'flex',
    gap: '22px',
    cursor: 'default',
    animation: 'lbWordIn 0.6s ease forwards',
  };
  const afterLinkStyle: Partial<CSSStyleDeclaration> = { fontSize: '14px', color: colors.sub, fontFamily: UI_FONT };

  if (s.author && s.author.trim()) {
    const authorSignatureStyle: Partial<CSSStyleDeclaration> = {
      position: 'relative',
      zIndex: '2',
      marginTop: '28px',
      fontFamily: FONT_MAP[font],
      fontStyle: font === 'hand' ? 'normal' : 'italic',
      fontSize: '17px',
      color: colors.sub,
      animation: 'lbWordIn 0.6s ease forwards',
    };
    sess.authorSignatureEl = h('div', { style: authorSignatureStyle }, [`— ${s.author}`]);
    sess.rootEl.querySelector('.lb-tapzone')!.appendChild(sess.authorSignatureEl);
  }

  const links: HTMLElement[] = [];
  if (s.previewMode) {
    links.push(h('a', { attrs: { href: '#' }, style: afterLinkStyle, on: { click: backToEditing } }, ['← back to editing']));
  } else {
    links.push(h('a', { attrs: { href: '#' }, style: afterLinkStyle, on: { click: startNewPoem } }, ['write your own']));
    const shareLink = h(
      'a',
      { attrs: { href: '#' }, style: afterLinkStyle, on: { click: shareThisPoem } },
      [s.copied ? 'copied ✓' : 'share'],
    ) as HTMLAnchorElement;
    sess.shareLinkEl = shareLink;
    links.push(shareLink);
  }
  sess.afterWrap = h('div', { style: afterLinksStyle, on: { click: stopClick } }, links);
  sess.rootEl.querySelector('.lb-tapzone')!.appendChild(sess.afterWrap);
}

function applyCosmetics(sess: ReaderSession): void {
  const s = state;
  const colors = resolveColors(s.hue, s.a11y, s.solidTheme);
  const font = s.font;
  const reveal = sess.reveal;
  const progressFrac = reveal.totalSteps > 0 ? Math.min(1, s.revealedCount / reveal.totalSteps) : 0;

  sess.rootEl.style.background = colors.pageBg;
  sess.blobsWrap.style.display = s.a11y ? 'none' : 'contents';

  sess.progressTrack.style.background = colors.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)';
  sess.progressFill.style.background = colors.sub;
  sess.progressFill.style.width = `${progressFrac * 100}%`;

  sess.tapHintEl.style.color = colors.sub;
  sess.tapHintEl.style.display = s.revealedCount === 0 ? '' : 'none';

  if (sess.titleEl) {
    sess.titleEl.style.color = colors.text;
  }

  sess.a11yBtn.style.background = s.a11y ? colors.text : 'transparent';
  sess.a11yBtn.style.color = s.a11y ? colors.pageBg : colors.text;
  sess.a11yBtn.style.opacity = s.a11y ? '1' : '0.6';
  sess.a11yBtn.setAttribute('aria-pressed', String(s.a11y));
  sess.a11yBtn.textContent = s.a11y ? 'reading mode ✓' : 'reading mode';

  for (const el of sess.lineEls) {
    if (el) applyLineStyle(el, font, colors);
  }

  if (sess.authorSignatureEl) {
    sess.authorSignatureEl.style.color = colors.sub;
    sess.authorSignatureEl.style.fontFamily = FONT_MAP[font];
    sess.authorSignatureEl.style.fontStyle = font === 'hand' ? 'normal' : 'italic';
  }
  if (sess.afterWrap) {
    for (const link of Array.from(sess.afterWrap.children) as HTMLElement[]) {
      link.style.color = colors.sub;
    }
  }
  if (sess.shareLinkEl) {
    sess.shareLinkEl.textContent = s.copied ? 'copied ✓' : 'share';
  }
}

export function mountReader(container: HTMLElement): void {
  const s = state;
  const rawLines = s.text.split('\n');
  const reveal = computeReveal(rawLines, s.lineConfigs);
  const colors = resolveColors(s.hue, s.a11y, s.solidTheme);
  const font = s.font;
  const blobs = s.solidTheme ? [] : makeBlobs(colors);

  const rootStyle: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    minHeight: '100dvh',
    width: '100%',
    overflow: 'hidden',
    background: colors.pageBg,
    fontFamily: UI_FONT,
    transition: 'background 0.6s ease',
  };
  const readerZoneStyle: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    minHeight: '100dvh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    outline: 'none',
    padding: '80px 24px',
    userSelect: 'none',
  };

  const blobEls = blobs.map((b) => h('div', { className: 'lb-blob', style: b.style }));
  const blobsWrap = h('div', { style: { display: s.a11y ? 'none' : 'contents' } }, blobEls);

  const progressTrack = h('div', {
    style: {
      position: 'fixed',
      left: '50%',
      bottom: '22px',
      transform: 'translateX(-50%)',
      width: '120px',
      height: '2px',
      borderRadius: '2px',
      background: colors.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)',
      zIndex: '2',
      overflow: 'hidden',
      pointerEvents: 'none',
    },
  });
  const progressFill = h('div', {
    style: { height: '100%', borderRadius: '2px', width: '0%', background: colors.sub, opacity: '0.55', transition: 'width 0.4s ease' },
  });
  progressTrack.appendChild(progressFill);

  const tapHintEl = h(
    'div',
    {
      className: 'lb-tap-hint',
      attrs: { 'aria-hidden': 'true' },
      style: {
        position: 'fixed',
        left: '50%',
        bottom: '40px',
        transform: 'translateX(-50%)',
        zIndex: '2',
        fontSize: '12px',
        fontFamily: UI_FONT,
        color: colors.sub,
        opacity: '0.6',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      },
    },
    ['tap or press space to reveal'],
  );

  const a11yBtn = h(
    'button',
    {
      style: {
        fontSize: '12px',
        padding: '6px 10px',
        borderRadius: '7px',
        border: '1px solid transparent',
        background: s.a11y ? colors.text : 'transparent',
        color: s.a11y ? colors.pageBg : colors.text,
        cursor: 'pointer',
        opacity: s.a11y ? '1' : '0.6',
        marginLeft: '4px',
      },
      attrs: { 'aria-pressed': String(s.a11y), 'aria-label': 'Toggle reading mode' },
      on: { click: toggleA11y },
    },
    [s.a11y ? 'reading mode ✓' : 'reading mode'],
  ) as HTMLButtonElement;

  const controls = h(
    'div',
    {
      style: {
        position: 'absolute',
        top: '18px',
        right: '18px',
        zIndex: '3',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        cursor: 'default',
      },
      on: { click: stopClick },
    },
    [a11yBtn],
  );

  const poemWrap = h('div', {
    style: {
      position: 'relative',
      zIndex: '2',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: 'center',
      maxWidth: '760px',
    },
  });

  const titleEl =
    s.title && s.title.trim()
      ? h(
          'div',
          {
            style: {
              position: 'fixed',
              top: '56px',
              left: '0',
              right: '0',
              margin: '0 auto',
              zIndex: '2',
              width: '100%',
              maxWidth: '760px',
              boxSizing: 'border-box',
              padding: '0 24px',
              fontFamily: FONT_MAP[font],
              fontWeight: '600',
              color: colors.text,
              fontSize: 'clamp(18px, 3vw, 28px)',
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
              pointerEvents: 'none',
              animation: 'lbWordIn 0.6s ease forwards',
            },
          },
          [s.title],
        )
      : null;

  const tapzone = h(
    'div',
    {
      className: 'lb-tapzone',
      attrs: { tabindex: '0', role: 'button', 'aria-label': 'Tap or press space to reveal the next line' },
      style: readerZoneStyle,
      focusKey: 'reader-tapzone',
      on: { click: handleTap, keydown: handleKeyDown },
    },
    [blobsWrap, progressTrack, tapHintEl, controls, titleEl, poemWrap],
  );

  const rootEl = h('div', { style: rootStyle }, [tapzone]);
  container.appendChild(rootEl);
  tapzone.focus();

  const lineEls: (HTMLElement | null)[] = new Array(reveal.lines.length).fill(null);
  const wordEls: (HTMLElement | null)[][] = reveal.lines.map(() => []);

  // blank-line spacers are always present regardless of reveal progress
  reveal.lines.forEach((line, i) => {
    if (!line.blank) return;
    const node = h('div', { style: { height: '0.7em' } }, [h('span', {}, [' '])]);
    poemWrap.appendChild(node);
    lineEls[i] = node;
  });

  session = {
    rootEl,
    blobsWrap,
    progressTrack,
    progressFill,
    tapHintEl,
    titleEl,
    a11yBtn,
    poemWrap,
    reveal,
    lineEls,
    wordEls,
    afterWrap: null,
    authorSignatureEl: null,
    shareLinkEl: null,
  };

  revealNewContent(session, font, colors);
  ensureAfterSection(session, colors, font);
  applyCosmetics(session);
}

export function updateReader(): void {
  if (!session) return;
  const s = state;
  const colors = resolveColors(s.hue, s.a11y, s.solidTheme);
  const font = s.font;

  revealNewContent(session, font, colors);
  ensureAfterSection(session, colors, font);
  applyCosmetics(session);
}

export function unmountReader(): void {
  session = null;
}
