import { describe, expect, it } from 'vitest';
import { computeReveal, decodePoem, encodePoem } from './poem';
import { defaultConfig } from './constants';
import type { LineConfig, PoemPayload } from './types';

function cfg(overrides: Partial<LineConfig> = {}): LineConfig {
  return { ...defaultConfig(), ...overrides };
}

describe('computeReveal', () => {
  it('assigns every word in a "whole" line the same step', () => {
    const reveal = computeReveal(['hello world'], [cfg({ mode: 'whole' })]);
    expect(reveal.lines).toEqual([
      { blank: false, words: [{ text: 'hello ', step: 0 }, { text: 'world', step: 0 }] },
    ]);
    expect(reveal.totalSteps).toBe(1);
  });

  it('assigns each word in a "word" line its own increasing step', () => {
    const reveal = computeReveal(['a b c'], [cfg({ mode: 'word' })]);
    expect(reveal.lines[0].words.map((w) => w.step)).toEqual([0, 1, 2]);
    expect(reveal.lines[0].words.map((w) => w.text)).toEqual(['a ', 'b ', 'c']);
    expect(reveal.totalSteps).toBe(3);
  });

  it('"split" mode reveals up to the break index in one step and the rest in the next', () => {
    const reveal = computeReveal(['a b c d'], [cfg({ mode: 'split', breakIndex: 1 })]);
    expect(reveal.lines[0].words.map((w) => w.step)).toEqual([0, 0, 1, 1]);
    expect(reveal.totalSteps).toBe(2);
  });

  it('"split" mode without an explicit breakIndex splits at the midpoint', () => {
    const reveal = computeReveal(['a b c d e'], [cfg({ mode: 'split', breakIndex: null })]);
    // 5 words -> floor((5-1)/2) = 2 -> words 0..2 get s1, 3..4 get s2
    expect(reveal.lines[0].words.map((w) => w.step)).toEqual([0, 0, 0, 1, 1]);
  });

  it('"split" mode falls back to the midpoint when breakIndex is out of range', () => {
    const outOfRange = computeReveal(['a b c d'], [cfg({ mode: 'split', breakIndex: 99 })]);
    const negative = computeReveal(['a b c d'], [cfg({ mode: 'split', breakIndex: -1 })]);
    const withNull = computeReveal(['a b c d'], [cfg({ mode: 'split', breakIndex: null })]);
    expect(outOfRange.lines[0].words.map((w) => w.step)).toEqual(withNull.lines[0].words.map((w) => w.step));
    expect(negative.lines[0].words.map((w) => w.step)).toEqual(withNull.lines[0].words.map((w) => w.step));
  });

  it('mergeNext makes the next line share the same step instead of starting a new one', () => {
    const reveal = computeReveal(
      ['a b', 'c d'],
      [cfg({ mode: 'whole', mergeNext: true }), cfg({ mode: 'whole', mergeNext: false })],
    );
    const allSteps = reveal.lines.flatMap((l) => l.words.map((w) => w.step));
    expect(allSteps).toEqual([0, 0, 0, 0]);
    expect(reveal.totalSteps).toBe(1);
  });

  it('without mergeNext, consecutive lines get separate steps', () => {
    const reveal = computeReveal(
      ['a b', 'c d'],
      [cfg({ mode: 'whole', mergeNext: false }), cfg({ mode: 'whole', mergeNext: false })],
    );
    expect(reveal.lines[0].words.map((w) => w.step)).toEqual([0, 0]);
    expect(reveal.lines[1].words.map((w) => w.step)).toEqual([1, 1]);
    expect(reveal.totalSteps).toBe(2);
  });

  it('blank lines are preserved but never consume a reveal step', () => {
    const reveal = computeReveal(['a', '', 'b'], [cfg(), cfg(), cfg()]);
    expect(reveal.lines[1]).toEqual({ blank: true, words: [] });
    expect(reveal.lines[0].words[0].step).toBe(0);
    expect(reveal.lines[2].words[0].step).toBe(1);
    expect(reveal.totalSteps).toBe(2);
  });

  it('a poem made only of blank lines still reports one total step', () => {
    const reveal = computeReveal([''], []);
    expect(reveal.lines).toEqual([{ blank: true, words: [] }]);
    expect(reveal.totalSteps).toBe(1);
  });

  it('preserves leading indentation and doubled interior spaces exactly', () => {
    const raw = ' a  b';
    const reveal = computeReveal([raw], [cfg({ mode: 'whole' })]);
    const rebuilt = reveal.lines[0].words.map((w) => w.text).join('');
    expect(rebuilt).toBe(raw);
  });

  it('falls back to a default config when none is provided for a line', () => {
    const reveal = computeReveal(['a b'], []);
    // default is "whole" mode, not merged — single step, and a following line would start fresh
    expect(reveal.lines[0].words.map((w) => w.step)).toEqual([0, 0]);
    expect(reveal.totalSteps).toBe(1);
  });
});

describe('encodePoem / decodePoem', () => {
  const payload: PoemPayload = {
    title: 'a small experiment',
    text: 'line one\nline two — “fancy” quotes and 🌊 emoji',
    lineConfigs: [cfg({ mode: 'word' }), cfg({ mode: 'split', breakIndex: 0, mergeNext: true })],
    font: 'hand',
    hue: 288,
    author: 'Jöel',
    solidTheme: 'sepia',
  };

  it('round-trips a payload exactly', () => {
    const encoded = encodePoem(payload);
    expect(decodePoem(encoded)).toEqual(payload);
  });

  it('produces a URL-safe string with no +, / or = characters', () => {
    const encoded = encodePoem(payload);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for garbage input instead of throwing', () => {
    expect(decodePoem('not valid base64 !!!')).toBeNull();
  });
});
