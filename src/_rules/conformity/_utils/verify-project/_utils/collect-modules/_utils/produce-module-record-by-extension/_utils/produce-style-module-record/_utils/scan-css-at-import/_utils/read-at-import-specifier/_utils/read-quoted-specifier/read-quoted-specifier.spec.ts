import { describe, expect, it } from 'vitest';

import { readQuotedSpecifier } from './read-quoted-specifier.util.js';

describe('readQuotedSpecifier', () => {
  it('reads double-quoted specifier', () => {
    const text = '"theme.css"; rest';
    const result = readQuotedSpecifier(text, 1, '"');

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(11);
  });

  it('reads single-quoted specifier', () => {
    const text = "'theme.css'; rest";
    const result = readQuotedSpecifier(text, 1, "'");

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(11);
  });

  it('handles escaped quotes inside specifier', () => {
    const text = '"foo\\"bar.css"';
    const result = readQuotedSpecifier(text, 1, '"');

    expect(result.raw).toBe('foo"bar.css');
    expect(result.nextIndex).toBe(text.length);
  });

  it.each([
    {
      expectedIndex: 9,
      expectedRaw: 'unclosed',
      name: 'LF',
      text: '"unclosed\n',
    },
    {
      expectedIndex: 9,
      expectedRaw: 'unclosed',
      name: 'CR',
      text: '"unclosed\r',
    },
    {
      expectedIndex: 16,
      expectedRaw: 'unclosed at eof',
      name: 'EOF',
      text: '"unclosed at eof',
    },
  ])(
    'terminates quoted read on $name',
    ({ expectedIndex, expectedRaw, text }) => {
      const result = readQuotedSpecifier(text, 1, '"');

      expect(result.raw).toBe(expectedRaw);
      expect(result.nextIndex).toBe(expectedIndex);
    }
  );

  it('handles trailing backslash at EOF inside quote', () => {
    const text = '"trailing\\';
    const result = readQuotedSpecifier(text, 1, '"');

    expect(result.raw).toBe('trailing');
    expect(result.nextIndex).toBe(9);
  });
});
