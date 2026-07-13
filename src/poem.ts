import { defaultConfig } from './constants';
import type { LineConfig, PoemPayload, Reveal, RevealLine } from './types';

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

export function encodePoem(obj: PoemPayload): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodePoem(str: string): PoemPayload | null {
  try {
    let s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch {
    return null;
  }
}
