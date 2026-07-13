import { renderApp } from './render';
import { computeReveal, encodePoem } from './poem';
import { persist, state } from './state';
import { defaultConfig } from './constants';
import type { FontKey, LineConfig, Preset, PoemPayload, RevealMode } from './types';

function updatePoem(patch: Partial<PoemPayload>): void {
  Object.assign(state, patch);
  state.hasLink = false;
  persist(state);
  renderApp();
}

export function handleTextChange(value: string): void {
  const lines = value.split('\n');
  const lineConfigs = lines.map((_, i) => state.lineConfigs[i] || defaultConfig());
  updatePoem({ text: value, lineConfigs });
}

export function handleAuthorChange(value: string): void {
  updatePoem({ author: value });
}

export function handleTitleChange(value: string): void {
  updatePoem({ title: value });
}

export function setLineMode(i: number, mode: RevealMode): void {
  const lineConfigs = state.lineConfigs.slice();
  lineConfigs[i] = { ...lineConfigs[i], mode };
  updatePoem({ lineConfigs });
}

export function setBreakIndex(i: number, idx: number): void {
  const lineConfigs = state.lineConfigs.slice();
  lineConfigs[i] = { ...lineConfigs[i], breakIndex: idx };
  updatePoem({ lineConfigs });
}

export function toggleMerge(i: number): void {
  const lineConfigs = state.lineConfigs.slice();
  lineConfigs[i] = { ...lineConfigs[i], mergeNext: !lineConfigs[i].mergeNext };
  updatePoem({ lineConfigs });
}

export function setPreset(preset: Preset): void {
  let lineConfigs = state.lineConfigs.slice();
  if (preset === 'line') {
    lineConfigs = lineConfigs.map((): LineConfig => ({ mode: 'whole', breakIndex: null, mergeNext: false }));
  } else if (preset === 'word') {
    lineConfigs = lineConfigs.map((): LineConfig => ({ mode: 'word', breakIndex: null, mergeNext: false }));
  }
  state.revealPreset = preset;
  updatePoem({ lineConfigs });
}

export function setFont(f: FontKey): void {
  updatePoem({ font: f });
}

export function setHue(h: number): void {
  updatePoem({ hue: h, solidTheme: null });
}

export function setSolidTheme(id: string): void {
  updatePoem({ solidTheme: id });
}

export function handleTap(): void {
  const reveal = computeReveal(state.text.split('\n'), state.lineConfigs);
  if (state.revealedCount < reveal.totalSteps) {
    state.revealedCount += 1;
    renderApp();
  }
}

export function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    handleTap();
  }
}

export function stopClick(e: Event): void {
  e.stopPropagation();
}

export function toggleA11y(e: Event): void {
  e.stopPropagation();
  state.a11y = !state.a11y;
  if (state.a11y) {
    const reveal = computeReveal(state.text.split('\n'), state.lineConfigs);
    state.revealedCount = reveal.totalSteps;
  }
  renderApp();
}

export function goPreview(e: Event): void {
  e.preventDefault();
  state.route = 'reader';
  state.previewMode = true;
  state.revealedCount = 0;
  state.a11y = false;
  renderApp();
}

export function backToEditing(e: Event): void {
  e.preventDefault();
  state.route = 'editor';
  renderApp();
}

export function startNewPoem(e: Event): void {
  e.preventDefault();
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch {
    // ignore
  }
  Object.assign(state, {
    route: 'editor',
    previewMode: false,
    title: '',
    text: '',
    lineConfigs: [],
    author: '',
    revealedCount: 0,
    hasLink: false,
    copied: false,
  });
  renderApp();
}

function copyToClipboard(text: string): Promise<boolean> {
  try {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}

function resetCopiedAfterDelay(): void {
  setTimeout(() => {
    state.copied = false;
    renderApp();
  }, 2000);
}

function shareText(): string {
  const title = state.title.trim();
  return title ? `Read my poetry called: ${title} here` : 'Read my poetry here';
}

// Prefers the OS-native share sheet (mainly available on mobile, and only in
// secure contexts — HTTPS or localhost, not a plain-HTTP LAN address); falls
// back to copying the link to the clipboard when Web Share isn't
// supported/fails. title/text/url are passed separately (not one combined
// string) so share targets that build a link preview/card — Messages,
// WhatsApp, etc. — render one, matching how native share sheets normally look.
function shareOrCopy(url: string): void {
  if (navigator.share) {
    navigator.share({ title: state.title.trim() || 'linebreak poem', text: shareText(), url }).catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') return; // user cancelled — nothing to fall back to
      copyToClipboard(url).then((ok) => {
        if (!ok) return;
        state.copied = true;
        renderApp();
        resetCopiedAfterDelay();
      });
    });
    return;
  }
  copyToClipboard(url).then((ok) => {
    if (!ok) return;
    state.copied = true;
    renderApp();
    resetCopiedAfterDelay();
  });
}

export function generateLink(e: Event): void {
  e.preventDefault();
  const payload: PoemPayload = {
    title: state.title,
    text: state.text,
    lineConfigs: state.lineConfigs,
    font: state.font,
    hue: state.hue,
    author: state.author,
    solidTheme: state.solidTheme,
  };
  const encoded = encodePoem(payload);
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + '#p=' + encoded);
  } catch {
    // ignore
  }
  const url = window.location.href;
  state.hasLink = true;
  state.shareUrl = url;
  state.copied = false;
  renderApp();
  shareOrCopy(url);
}

export function copyLink(e: Event): void {
  e.preventDefault();
  copyToClipboard(state.shareUrl).then((ok) => {
    if (!ok) return;
    state.copied = true;
    renderApp();
    resetCopiedAfterDelay();
  });
}

export function shareThisPoem(e: Event): void {
  e.preventDefault();
  shareOrCopy(window.location.href);
}

export function selectLinkInput(e: Event): void {
  (e.target as HTMLInputElement).select();
}
