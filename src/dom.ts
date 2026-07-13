type Handler = (e: any) => void;

export interface ElProps {
  style?: Partial<CSSStyleDeclaration>;
  className?: string;
  attrs?: Record<string, string | boolean | undefined | null>;
  on?: Record<string, Handler>;
  focusKey?: string;
  value?: string;
  props?: Record<string, unknown>;
  text?: string;
}

export type Child = Node | string | null | undefined | false;

export function h(tag: string, props: ElProps = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);

  if (props.className) el.className = props.className;

  if (props.style) {
    Object.assign(el.style, props.style);
  }

  if (props.attrs) {
    for (const [key, val] of Object.entries(props.attrs)) {
      if (val === false || val == null) continue;
      el.setAttribute(key, val === true ? '' : String(val));
    }
  }

  if (props.on) {
    for (const [ev, handler] of Object.entries(props.on)) {
      el.addEventListener(ev, handler);
    }
  }

  if (props.focusKey) el.dataset.focusKey = props.focusKey;

  if (props.value !== undefined) {
    (el as HTMLInputElement | HTMLTextAreaElement).value = props.value;
  }

  if (props.props) Object.assign(el, props.props);

  if (props.text !== undefined) el.textContent = props.text;

  for (const child of children) {
    if (child == null || child === false) continue;
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return el;
}
