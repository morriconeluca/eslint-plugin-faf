import { describe, expect, it } from 'vitest';

import { skipCssString } from './skip-css-string.util.js';

describe('skipCssString', () => {
  it('returns skipped false when current character is not a quote', () => {
    const text = 'div { color: red; }';
    const result = skipCssString(text, 0);

    expect(result.skipped).toBe(false);
    expect(result.nextIndex).toBe(0);
  });

  it.each([
    {
      expectedIndex: 13,
      name: 'double-quoted',
      text: '"hello world" rest',
    },
    {
      expectedIndex: 13,
      name: 'single-quoted',
      text: "'hello world' rest",
    },
  ])('skips $name strings', ({ expectedIndex, text }) => {
    const result = skipCssString(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(expectedIndex);
  });

  it('handles escaped quotes and backslashes', () => {
    const text = '"escaped \\" quote \\\\ and more" rest';
    const result = skipCssString(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(30);
  });

  it.each([
    {
      expectedIndex: 21,
      name: 'LF',
      text: '"unterminated string\nnext line',
    },
    {
      expectedIndex: 21,
      name: 'CR',
      text: '"unterminated string\rnext line',
    },
    {
      expectedIndex: 27,
      name: 'EOF',
      text: '"unterminated string at eof',
    },
  ])('terminates string on unescaped $name', ({ expectedIndex, text }) => {
    const result = skipCssString(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(expectedIndex);
  });

  it('handles trailing backslash at EOF inside string', () => {
    const text = '"trailing backslash\\';
    const result = skipCssString(text, 0);

    expect(result.skipped).toBe(true);
    expect(result.nextIndex).toBe(text.length);
  });
});
