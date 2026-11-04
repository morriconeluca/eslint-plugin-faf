import { describe, expect, it } from 'vitest';

import { readQuotedUrl } from './read-quoted-url.util.js';

describe('readQuotedUrl', () => {
  it('reads quoted url content until matching quote and closing paren', () => {
    const text = '"theme.css") rest';
    const result = readQuotedUrl(text, 1, '"');

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(12);
  });

  it('handles escaped quotes inside url', () => {
    const text = '"foo\\"bar.css")';
    const result = readQuotedUrl(text, 1, '"');

    expect(result.raw).toBe('foo"bar.css');
    expect(result.nextIndex).toBe(text.length);
  });

  it.each([
    {
      expectedIndex: 11,
      expectedRaw: 'unclosed',
      name: 'LF',
      text: '"unclosed\n)',
    },
    {
      expectedIndex: 11,
      expectedRaw: 'unclosed',
      name: 'CR',
      text: '"unclosed\r)',
    },
    {
      expectedIndex: 16,
      expectedRaw: 'unclosed at eof',
      name: 'EOF',
      text: '"unclosed at eof',
    },
    {
      expectedIndex: 10,
      expectedRaw: 'trailing',
      name: 'trailing backslash',
      text: '"trailing\\',
    },
  ])(
    'terminates quoted read on $name',
    ({ expectedIndex, expectedRaw, text }) => {
      const result = readQuotedUrl(text, 1, '"');

      expect(result.raw).toBe(expectedRaw);
      expect(result.nextIndex).toBe(expectedIndex);
    }
  );

  it('handles url missing closing parenthesis', () => {
    const text = '"theme.css"';
    const result = readQuotedUrl(text, 1, '"');

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(text.length);
  });
});
