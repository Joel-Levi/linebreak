import { DEFAULT_CONFIGS, DEFAULT_TEXT } from './constants';
import { decodePoem } from './poem';
import type { AppState, PoemPayload } from './types';

const STORAGE_KEY = 'linebreak_draft';

function initialState(): AppState {
  const base: AppState = {
    route: 'editor',
    previewMode: false,
    title: '',
    text: DEFAULT_TEXT,
    lineConfigs: DEFAULT_CONFIGS,
    font: 'serif',
    hue: 195,
    author: '',
    solidTheme: null,
    a11y: false,
    revealPreset: 'advanced',
    revealedCount: 0,
    copied: false,
    hasLink: false,
    shareUrl: '',
  };

  try {
    const hash = window.location.hash || '';
    if (hash.indexOf('#p=') === 0) {
      const decoded = decodePoem(hash.slice(3));
      if (decoded && decoded.text) {
        return {
          ...base,
          route: 'reader',
          previewMode: false,
          revealedCount: 0,
          title: decoded.title || '',
          text: decoded.text,
          lineConfigs: decoded.lineConfigs || [],
          font: decoded.font || 'serif',
          hue: decoded.hue || 195,
          author: decoded.author || '',
          solidTheme: decoded.solidTheme ?? null,
          hasLink: true,
          shareUrl: window.location.href,
        };
      }
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.text === 'string') {
        return {
          ...base,
          title: parsed.title || '',
          text: parsed.text,
          lineConfigs: parsed.lineConfigs || [],
          font: parsed.font || 'serif',
          hue: parsed.hue || 195,
          author: parsed.author || '',
          solidTheme: parsed.solidTheme ?? null,
        };
      }
    }
  } catch {
    // ignore malformed hash/storage
  }

  return base;
}

export const state: AppState = initialState();

export function persist(next: PoemPayload): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title: next.title,
        text: next.text,
        lineConfigs: next.lineConfigs,
        font: next.font,
        hue: next.hue,
        author: next.author,
        solidTheme: next.solidTheme,
      }),
    );
  } catch {
    // storage unavailable
  }
}
