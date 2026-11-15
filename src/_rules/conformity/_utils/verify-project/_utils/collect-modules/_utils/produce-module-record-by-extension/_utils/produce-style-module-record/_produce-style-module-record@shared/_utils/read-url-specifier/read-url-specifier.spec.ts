import { describe, expect, it } from 'vitest';

import { readUrlSpecifier } from './read-url-specifier.util.js';

describe('readUrlSpecifier', () => {
  it('returns null when text does not start with url(', () => {
    expect(readUrlSpecifier('var(--x)', 0)).toBeNull();
    expect(readUrlSpecifier('url = 1', 0)).toBeNull();
  });

  it('reads quoted, unquoted, nested-paren, escaped, and unterminated url() specifiers', () => {
    expect(readUrlSpecifier('url("a/b.png")', 0)).toEqual({
      nextIndex: 14,
      raw: 'a/b.png',
    });
    expect(readUrlSpecifier("url('a\\'b.png')", 0)).toEqual({
      nextIndex: 15,
      raw: "a'b.png",
    });
    expect(readUrlSpecifier('url(var(--custom))', 0)).toEqual({
      nextIndex: 18,
      raw: 'var(--custom)',
    });
    expect(readUrlSpecifier('url("unclosed\\', 0)).toEqual({
      nextIndex: 14,
      raw: 'unclosed',
    });
    expect(readUrlSpecifier('url("unclosed\n', 0)).toEqual({
      nextIndex: 14,
      raw: 'unclosed',
    });
  });
});
