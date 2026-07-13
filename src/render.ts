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
  let focusKey: string | null = null;
  let selStart: number | null = null;
  let selEnd: number | null = null;
  let scrollTop: number | null = null;

  if (active && container.contains(active) && active.dataset && active.dataset.focusKey) {
    focusKey = active.dataset.focusKey;
    if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
      selStart = active.selectionStart;
      selEnd = active.selectionEnd;
      if (active instanceof HTMLTextAreaElement) scrollTop = active.scrollTop;
    }
  }

  container.innerHTML = '';
  container.appendChild(renderEditor());

  if (focusKey) {
    const restored = container.querySelector(`[data-focus-key="${focusKey}"]`) as HTMLElement | null;
    if (restored) {
      restored.focus();
      if (
        (restored instanceof HTMLTextAreaElement || restored instanceof HTMLInputElement) &&
        selStart != null &&
        selEnd != null
      ) {
        restored.setSelectionRange(selStart, selEnd);
      }
      if (restored instanceof HTMLTextAreaElement && scrollTop != null) restored.scrollTop = scrollTop;
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
