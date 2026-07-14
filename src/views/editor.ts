import { accentColors, makeBlobs, oklch, resolveColors } from '../colors';
import { FONT_LABELS, FONT_MAP, FONT_ORDER, HUE_OPTIONS, MODE_OPTIONS, PRESET_OPTIONS, SOLID_THEMES, defaultConfig } from '../constants';
import { h } from '../dom';
import {
  copyLink,
  generateLink,
  goPreview,
  handleAuthorChange,
  handleTextChange,
  handleTitleChange,
  selectLinkInput,
  setBreakIndex,
  setFont,
  setHue,
  setLineMode,
  setPreset,
  setSolidTheme,
  toggleMerge,
} from '../actions';
import { state } from '../state';

const UI_FONT = 'system-ui, -apple-system, sans-serif';

export function renderEditor(): HTMLElement {
  const s = state;
  const rawLines = s.text.split('\n');
  const colors = resolveColors(s.hue, s.a11y, s.solidTheme);
  const blobs = s.solidTheme ? [] : makeBlobs(colors);

  const rootStyle: Partial<CSSStyleDeclaration> = {
    position: 'relative',
    minHeight: '100dvh',
    width: '100%',
    overflow: 'hidden',
    background: oklch(98, 0.004, 60),
    fontFamily: UI_FONT,
    transition: 'background 0.6s ease',
  };

  const editorPageStyle: Partial<CSSStyleDeclaration> = {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '48px 24px 96px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const brandRow = h('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' } }, [
    h('span', { style: { fontSize: '17px', fontWeight: '600', color: oklch(20, 0.01, 60), letterSpacing: '-0.01em' } }, ['linebreak']),
    h(
      'span',
      {
        style: {
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: '11px',
          color: oklch(45, 0.01, 60),
          background: oklch(93, 0.006, 60),
          padding: '2px 6px',
          borderRadius: '5px',
        },
      },
      ['<br>'],
    ),
  ]);

  const cardStyle = (): Partial<CSSStyleDeclaration> => ({
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  });
  const labelStyle: Partial<CSSStyleDeclaration> = {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: oklch(45, 0.01, 60),
  };
  const labelStyleSpaced: Partial<CSSStyleDeclaration> = { ...labelStyle, marginTop: '10px' };

  // ---------- poem / author card ----------
  const textareaStyle: Partial<CSSStyleDeclaration> = {
    width: '100%',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '15px',
    lineHeight: '1.6',
    resize: 'vertical',
    fontFamily: UI_FONT,
    color: oklch(20, 0.02, 60),
    outline: 'none',
  };
  const authorInputStyle: Partial<CSSStyleDeclaration> = {
    width: '100%',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    fontFamily: UI_FONT,
    color: oklch(20, 0.02, 60),
    outline: 'none',
  };

  const poemCard = h('div', { style: cardStyle() }, [
    h('label', { style: labelStyle }, ['title (optional)']),
    h('input', {
      value: s.title,
      focusKey: 'poem-title',
      attrs: { placeholder: 'untitled' },
      style: authorInputStyle,
      on: { input: (e: Event) => handleTitleChange((e.target as HTMLInputElement).value) },
    }),
    h('label', { style: labelStyleSpaced }, ['write your poem — one line per row']),
    h('textarea', {
      value: s.text,
      focusKey: 'poem-text',
      attrs: { rows: '10', placeholder: 'type your poem here…' },
      style: textareaStyle,
      on: { input: (e: Event) => handleTextChange((e.target as HTMLTextAreaElement).value) },
    }),
    h('label', { style: labelStyleSpaced }, ['signed by (optional)']),
    h('input', {
      value: s.author,
      focusKey: 'poem-author',
      attrs: { placeholder: 'your name' },
      style: authorInputStyle,
      on: { input: (e: Event) => handleAuthorChange((e.target as HTMLInputElement).value) },
    }),
  ]);

  // ---------- reveal style card ----------
  const presetButtons = PRESET_OPTIONS.map((pd) => {
    const active = s.revealPreset === pd.key;
    return h(
      'button',
      {
        on: { click: () => setPreset(pd.key) },
        style: {
          fontSize: '13px',
          padding: '7px 12px',
          borderRadius: '7px',
          cursor: 'pointer',
          border: active ? `1px solid ${oklch(20, 0.02, 60)}` : '1px solid rgba(0,0,0,0.12)',
          background: active ? oklch(20, 0.02, 60) : 'transparent',
          color: active ? '#fff' : oklch(35, 0.01, 60),
        },
      },
      [pd.label],
    );
  });

  const editorLineRows =
    s.revealPreset === 'advanced'
      ? rawLines
          .map((raw, i) => {
            const trimmed = raw.trim();
            if (trimmed === '') return null;

            const cfg = s.lineConfigs[i] || defaultConfig();
            const words = trimmed.split(/\s+/);
            const isLastLine = i === rawLines.length - 1;

            const modeButtons = MODE_OPTIONS.map((mo) => {
              const active = cfg.mode === mo.key;
              return h(
                'button',
                {
                  on: { click: () => setLineMode(i, mo.key) },
                  style: {
                    fontSize: '12px',
                    padding: '5px 9px',
                    borderRadius: '6px',
                    border: active ? `1px solid ${oklch(20, 0.02, 60)}` : '1px solid rgba(0,0,0,0.12)',
                    background: active ? oklch(20, 0.02, 60) : 'transparent',
                    color: active ? '#fff' : oklch(35, 0.01, 60),
                    cursor: 'pointer',
                  },
                },
                [mo.label],
              );
            });

            let bi = cfg.breakIndex;
            if (bi == null || bi < 0 || bi >= words.length - 1) {
              bi = Math.max(0, Math.floor((words.length - 1) / 2));
            }
            const finalBi = bi;

            const segmentWrap = h(
              'div',
              { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' } },
              [
                ...modeButtons,
                !isLastLine
                  ? h(
                      'button',
                      {
                        on: { click: () => toggleMerge(i) },
                        style: {
                          fontSize: '12px',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          marginLeft: 'auto',
                          border: `1px dashed ${cfg.mergeNext ? oklch(45, 0.16, s.hue) : 'rgba(0,0,0,0.18)'}`,
                          background: cfg.mergeNext ? oklch(94, 0.03, s.hue) : 'transparent',
                          color: cfg.mergeNext ? oklch(35, 0.16, s.hue) : oklch(45, 0.01, 60),
                          cursor: 'pointer',
                        },
                      },
                      [cfg.mergeNext ? '⏤ merged with next ✓' : '⏤ merge with next line'],
                    )
                  : null,
              ],
            );

            const wordPicker =
              cfg.mode === 'split'
                ? h(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                    [
                      h('span', { style: { fontSize: '11px', color: oklch(50, 0.01, 60) } }, ['tap the last word of the first reveal:']),
                      h(
                        'div',
                        { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
                        words.map((w, wi) => {
                          const active = wi <= finalBi;
                          return h(
                            'button',
                            {
                              on: { click: () => setBreakIndex(i, wi) },
                              style: {
                                fontSize: '13px',
                                padding: '3px 7px',
                                borderRadius: '5px',
                                border: wi === finalBi ? `1px solid ${oklch(45, 0.16, s.hue)}` : '1px solid transparent',
                                background: active ? oklch(92, 0.03, s.hue) : 'transparent',
                                color: oklch(25, 0.02, 60),
                                cursor: 'pointer',
                              },
                            },
                            [w],
                          );
                        }),
                      ),
                    ],
                  )
                : null;

            return h(
              'div',
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
                },
              },
              [
                h(
                  'div',
                  { style: { fontFamily: FONT_MAP[s.font], fontSize: '15px', color: oklch(20, 0.02, 60), whiteSpace: 'pre-wrap' } },
                  [raw],
                ),
                segmentWrap,
                wordPicker,
              ],
            );
          })
          .filter((n): n is HTMLElement => n !== null)
      : [];

  const revealCard = h('div', { style: cardStyle() }, [
    h('label', { style: labelStyle }, ['reveal style']),
    h('div', { style: { display: 'flex', gap: '6px' } }, presetButtons),
    ...editorLineRows,
  ]);

  // ---------- font / color card ----------
  const fontPreviewText = 'your text will look like this';

  const fontOptions = FONT_ORDER.map((f) => {
    const active = s.font === f;
    return h(
      'button',
      {
        on: { click: () => setFont(f) },
        style: {
          fontFamily: FONT_MAP[f],
          fontSize: '17px',
          padding: '10px 14px',
          borderRadius: '9px',
          border: active ? `1.5px solid ${oklch(20, 0.02, 60)}` : '1px solid rgba(0,0,0,0.12)',
          background: active ? oklch(96, 0.006, 60) : '#fff',
          color: oklch(20, 0.02, 60),
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          minWidth: '64px',
        },
      },
      ['Aa', h('span', { style: { fontFamily: UI_FONT, fontSize: '10px', color: oklch(48, 0.01, 60) } }, [FONT_LABELS[f]])],
    );
  });

  function backgroundSwatchStyle(active: boolean, background: string, textColor: string): Partial<CSSStyleDeclaration> {
    return {
      width: '34px',
      height: '34px',
      borderRadius: '8px',
      cursor: 'pointer',
      background,
      border: active ? `2px solid ${oklch(20, 0.02, 60)}` : '1px solid rgba(0,0,0,0.15)',
      boxShadow: active ? '0 0 0 2px #fff inset' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '600',
      color: textColor,
    };
  }

  const hueOptions = HUE_OPTIONS.map((ho) => {
    const active = s.solidTheme === null && s.hue === ho.hue;
    const hueColors = accentColors(ho.hue, false);
    return h(
      'button',
      {
        on: { click: () => setHue(ho.hue) },
        attrs: { 'aria-label': ho.name, title: ho.name },
        style: backgroundSwatchStyle(active, `linear-gradient(135deg, ${hueColors.pageBg}, ${hueColors.c1})`, hueColors.text),
      },
      ['Aa'],
    );
  });

  const solidThemeOptions = SOLID_THEMES.map((theme) => {
    const active = s.solidTheme === theme.id;
    return h(
      'button',
      {
        on: { click: () => setSolidTheme(theme.id) },
        attrs: { 'aria-label': theme.name, title: theme.name },
        style: backgroundSwatchStyle(active, theme.pageBg, theme.text),
      },
      ['Aa'],
    );
  });

  const combinedPreview = h(
    'div',
    {
      style: {
        position: 'relative',
        height: '110px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: colors.pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.06)',
        transition: 'background 0.3s ease',
      },
    },
    [
      ...blobs.map((b) => h('div', { className: 'lb-blob', style: b.miniStyle })),
      h(
        'div',
        {
          style: {
            position: 'relative',
            zIndex: '2',
            fontFamily: FONT_MAP[s.font],
            fontSize: '22px',
            fontWeight: s.font === 'hand' ? '600' : '400',
            color: colors.text,
            padding: '0 16px',
            textAlign: 'center',
          },
        },
        [fontPreviewText],
      ),
    ],
  );

  const fontColorCard = h('div', { style: cardStyle() }, [
    h('label', { style: labelStyle }, ['font']),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, fontOptions),

    h('label', { style: labelStyleSpaced }, ['background']),
    h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [...hueOptions, ...solidThemeOptions]),

    h('label', { style: labelStyleSpaced }, ['preview']),
    combinedPreview,
  ]);

  // ---------- actions ----------
  const shared = s.copied && s.hasLink;
  const generateLinkLabel = shared ? 'copied ✓' : 'share';
  const copyLabel = s.copied ? 'copied ✓' : 'copy';

  const actionsRow = h('div', { style: { display: 'flex', gap: '20px', alignItems: 'center', marginTop: '4px' } }, [
    h('a', { attrs: { href: '#' }, style: { fontSize: '15px', fontWeight: '600', color: oklch(20, 0.02, 60) }, on: { click: goPreview } }, [
      'preview →',
    ]),
    h(
      'a',
      {
        className: 'lb-share-btn',
        attrs: { href: '#' },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#fff',
          background: shared ? oklch(45, 0.15, 145) : oklch(20, 0.02, 60),
          padding: '11px 22px',
          borderRadius: '999px',
          textDecoration: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.12)',
        },
        on: { click: generateLink },
      },
      [generateLinkLabel, shared ? null : '↗'],
    ),
  ]);

  const linkBox = s.hasLink
    ? h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
        h('input', {
          value: s.shareUrl,
          attrs: { readonly: 'true' },
          style: {
            flex: '1',
            fontSize: '13px',
            padding: '9px 11px',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.12)',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            color: oklch(30, 0.01, 60),
          },
          on: { click: selectLinkInput },
        }),
        h(
          'button',
          {
            on: { click: copyLink },
            style: {
              fontSize: '13px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: 'none',
              background: oklch(20, 0.02, 60),
              color: '#fff',
              cursor: 'pointer',
            },
          },
          [copyLabel],
        ),
      ])
    : null;

  const editorPage = h('div', { style: editorPageStyle }, [brandRow, poemCard, revealCard, fontColorCard, actionsRow, linkBox]);

  return h('div', { style: rootStyle }, [editorPage]);
}
