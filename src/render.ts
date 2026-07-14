import { state } from './state';
import { renderEditor } from './views/editor';
import { mountReader, unmountReader, updateReader } from './views/reader';

let root: HTMLElement | null = null;
let mountedRoute: 'editor' | 'reader' | null = null;

export function mount(container: HTMLElement): void {
  root = container;
  renderApp();
}

function rebuildEditorWithFocusPreserved(): void {
  const container = root!;
  const active = document.activeElement as HTMLElement | null;
  const focusKey = active && container.contains(active) ? active.dataset?.focusKey : undefined;

  // Built off-screen — doesn't touch the live DOM yet, so the currently
  // focused input (if any) is still untouched at this point.
  const newTree = renderEditor();

  let preserved: HTMLElement | null = null;
  if (focusKey) {
    const placeholder = newTree.querySelector(`[data-focus-key="${focusKey}"]`) as HTMLElement | null;
    if (placeholder && active) {
      // Move the SAME live node into the new tree in place of its freshly
      // built placeholder, instead of creating a brand-new element and
      // copying value/selection onto it. Reparenting still blurs it (tested:
      // it does), so focus is restored below regardless — but keeping the
      // actual node (rather than a fresh clone) preserves things a brand-new
      // element wouldn't: undo history, and it's the more correct general
      // practice for avoiding mobile IME/autocorrect disruption than
      // recreating the element outright.
      placeholder.replaceWith(active);
      preserved = active;
    }
  }

  container.innerHTML = '';
  container.appendChild(newTree);

  if (preserved) {
    preserved.focus();
    if (preserved instanceof HTMLTextAreaElement || preserved instanceof HTMLInputElement) {
      const { selectionStart, selectionEnd } = preserved;
      if (selectionStart != null && selectionEnd != null) preserved.setSelectionRange(selectionStart, selectionEnd);
    }
  }
}

export function renderApp(): void {
  if (!root) return;

  if (state.route === 'reader') {
    if (mountedRoute !== 'reader') {
      root.innerHTML = '';
      mountReader(root);
    } else {
      updateReader();
    }
    mountedRoute = 'reader';
    return;
  }

  if (mountedRoute === 'reader') unmountReader();
  mountedRoute = 'editor';
  rebuildEditorWithFocusPreserved();
}
