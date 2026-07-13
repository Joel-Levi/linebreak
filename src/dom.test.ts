// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { h } from './dom';

describe('h', () => {
  it('creates an element of the requested tag', () => {
    const el = h('button');
    expect(el.tagName).toBe('BUTTON');
  });

  it('applies className and style', () => {
    const el = h('div', { className: 'lb-blob', style: { color: 'red', fontSize: '12px' } });
    expect(el.className).toBe('lb-blob');
    expect(el.style.color).toBe('red');
    expect(el.style.fontSize).toBe('12px');
  });

  it('sets string attrs and omits false/null/undefined ones', () => {
    const el = h('input', {
      attrs: { placeholder: 'hi', readonly: true, disabled: false, 'aria-label': undefined, hidden: null },
    });
    expect(el.getAttribute('placeholder')).toBe('hi');
    expect(el.getAttribute('readonly')).toBe('');
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.hasAttribute('hidden')).toBe(false);
  });

  it('wires up event listeners', () => {
    const onClick = vi.fn();
    const el = h('button', { on: { click: onClick } });
    el.dispatchEvent(new MouseEvent('click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets dataset.focusKey from focusKey', () => {
    const el = h('textarea', { focusKey: 'poem-text' });
    expect(el.dataset.focusKey).toBe('poem-text');
  });

  it('sets .value on inputs/textareas', () => {
    const el = h('input', { value: 'hello' }) as HTMLInputElement;
    expect(el.value).toBe('hello');
  });

  it('assigns arbitrary DOM properties via props', () => {
    const el = h('input', { props: { readOnly: true } }) as HTMLInputElement;
    expect(el.readOnly).toBe(true);
  });

  it('sets textContent from text', () => {
    const el = h('span', { text: 'hi there' });
    expect(el.textContent).toBe('hi there');
  });

  it('appends string children as text nodes and element children as-is, in order', () => {
    const child = h('span', { text: 'child' });
    const el = h('div', {}, ['before ', child, ' after']);
    expect(el.childNodes).toHaveLength(3);
    expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(el.childNodes[1]).toBe(child);
    expect(el.textContent).toBe('before child after');
  });

  it('skips null, undefined, and false children', () => {
    const el = h('div', {}, ['a', null, undefined, false, 'b']);
    expect(el.childNodes).toHaveLength(2);
    expect(el.textContent).toBe('ab');
  });
});
