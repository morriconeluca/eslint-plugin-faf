import { describe, expect, it } from 'vitest';

import { readUrlSpecifier } from './read-url-specifier.util.js';

describe('readUrlSpecifier', () => {
  it('returns empty result when start is not url function', () => {
    const text = 'not-url("foo.css")';
    const result = readUrlSpecifier(text, 0);

    expect(result.raw).toBe('');
    expect(result.nextIndex).toBe(0);
  });

  it('reads empty url() inside @import', () => {
    const text = 'url();';
    const result = readUrlSpecifier(text, 0);

    expect(result.raw).toBe('');
    expect(result.nextIndex).toBe(5);
  });

  it.each([
    {
      expectedRaw: 'theme.css',
      name: 'double-quoted',
      text: 'url("theme.css");',
    },
    {
      expectedRaw: 'theme.css',
      name: 'single-quoted',
      text: "url('theme.css');",
    },
    {
      expectedRaw: 'theme.css',
      name: 'unquoted',
      text: 'url(theme.css);',
    },
    {
      expectedRaw: 'var(--theme)',
      name: 'nested-parens',
      text: 'url(var(--theme));',
    },
  ])('reads $name url specifier', ({ expectedRaw, text }) => {
    const result = readUrlSpecifier(text, 0);

    expect(result.raw).toBe(expectedRaw);
    expect(result.nextIndex).toBeGreaterThan(0);
  });
});
