// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIGS, DEFAULT_TEXT } from './constants';
import { encodePoem } from './poem';
import type { PoemPayload } from './types';

async function freshState() {
  vi.resetModules();
  const mod = await import('./state');
  return mod;
}

describe('state.ts initial load', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });

  afterEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });

  it('falls back to the default poem when there is no hash or saved draft', async () => {
    const { state } = await freshState();
    expect(state.route).toBe('editor');
    expect(state.title).toBe('');
    expect(state.text).toBe(DEFAULT_TEXT);
    expect(state.lineConfigs).toEqual(DEFAULT_CONFIGS);
    expect(state.font).toBe('serif');
    expect(state.hue).toBe(195);
    expect(state.solidTheme).toBeNull();
    expect(state.hasLink).toBe(false);
  });

  it('loads a shared poem from the URL hash and switches straight to the reader', async () => {
    const payload: PoemPayload = {
      title: 'a shared title',
      text: 'shared poem\nsecond line',
      lineConfigs: [{ mode: 'word', breakIndex: null, mergeNext: false }, { mode: 'whole', breakIndex: null, mergeNext: false }],
      font: 'mono',
      hue: 68,
      author: 'Ada',
      solidTheme: 'sepia',
    };
    window.location.hash = '#p=' + encodePoem(payload);

    const { state } = await freshState();
    expect(state.route).toBe('reader');
    expect(state.previewMode).toBe(false);
    expect(state.revealedCount).toBe(0);
    expect(state.hasLink).toBe(true);
    expect(state.shareUrl).toBe(window.location.href);
    expect(state.title).toBe('a shared title');
    expect(state.text).toBe(payload.text);
    expect(state.lineConfigs).toEqual(payload.lineConfigs);
    expect(state.font).toBe('mono');
    expect(state.hue).toBe(68);
    expect(state.author).toBe('Ada');
    expect(state.solidTheme).toBe('sepia');
  });

  it('ignores a malformed hash and falls back to defaults instead of throwing', async () => {
    window.location.hash = '#p=not-valid-base64!!!';
    const { state } = await freshState();
    expect(state.route).toBe('editor');
    expect(state.text).toBe(DEFAULT_TEXT);
  });

  it('loads a saved draft from localStorage when there is no hash', async () => {
    window.localStorage.setItem(
      'linebreak_draft',
      JSON.stringify({
        title: 'draft title',
        text: 'my draft',
        lineConfigs: [{ mode: 'whole', breakIndex: null, mergeNext: false }],
        font: 'mono',
        hue: 68,
        author: 'Test',
        solidTheme: 'high-contrast-dark',
      }),
    );
    const { state } = await freshState();
    expect(state.route).toBe('editor');
    expect(state.title).toBe('draft title');
    expect(state.text).toBe('my draft');
    expect(state.font).toBe('mono');
    expect(state.hue).toBe(68);
    expect(state.author).toBe('Test');
    expect(state.solidTheme).toBe('high-contrast-dark');
    expect(state.hasLink).toBe(false);
  });

  it('ignores a corrupt localStorage draft and falls back to defaults', async () => {
    window.localStorage.setItem('linebreak_draft', '{not json');
    const { state } = await freshState();
    expect(state.text).toBe(DEFAULT_TEXT);
  });

  it('a valid hash takes priority over a saved draft', async () => {
    window.localStorage.setItem(
      'linebreak_draft',
      JSON.stringify({ title: '', text: 'draft text', lineConfigs: [], font: 'serif', hue: 195, author: '', solidTheme: null }),
    );
    const payload: PoemPayload = { title: '', text: 'hash text', lineConfigs: [], font: 'sans', hue: 15, author: '', solidTheme: null };
    window.location.hash = '#p=' + encodePoem(payload);

    const { state } = await freshState();
    expect(state.route).toBe('reader');
    expect(state.text).toBe('hash text');
  });

  it('gracefully falls back to the default poem for a hash from before the compressed/compact link format', async () => {
    // simulates a link shared before the compression + compact-array rewrite.
    // Old links are not expected to keep working across that change, but
    // loading one must not crash — it should just fall through to defaults.
    const legacyPayload = { text: 'old link', lineConfigs: [], font: 'serif', hue: 195, author: '' };
    const json = JSON.stringify(legacyPayload);
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    window.location.hash = '#p=' + b64;

    const { state } = await freshState();
    expect(state.route).toBe('editor');
    expect(state.text).toBe(DEFAULT_TEXT);
  });

  it('defaults solidTheme and title to their empty values when a saved draft predates those fields', async () => {
    window.localStorage.setItem(
      'linebreak_draft',
      JSON.stringify({ text: 'old draft', lineConfigs: [], font: 'serif', hue: 195, author: '' }),
    );
    const { state } = await freshState();
    expect(state.solidTheme).toBeNull();
    expect(state.title).toBe('');
  });
});

describe('persist', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '';
  });

  it('writes only the poem-shape fields (including title and solidTheme) to localStorage', async () => {
    const { persist } = await freshState();
    persist({
      title: 'my title',
      text: 'abc',
      lineConfigs: [{ mode: 'whole', breakIndex: null, mergeNext: false }],
      font: 'hand',
      hue: 232,
      author: 'X',
      solidTheme: 'yellow-on-black',
    });
    const saved = JSON.parse(window.localStorage.getItem('linebreak_draft')!);
    expect(saved).toEqual({
      title: 'my title',
      text: 'abc',
      lineConfigs: [{ mode: 'whole', breakIndex: null, mergeNext: false }],
      font: 'hand',
      hue: 232,
      author: 'X',
      solidTheme: 'yellow-on-black',
    });
  });
});
