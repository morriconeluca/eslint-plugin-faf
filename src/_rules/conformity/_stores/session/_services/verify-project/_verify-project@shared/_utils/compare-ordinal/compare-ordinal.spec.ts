import { describe, expect, it } from 'vitest';

import { compareOrdinal } from './index.js';

describe('compareOrdinal', () => {
  it('returns zero when both strings are equal, including the empty string', () => {
    expect(compareOrdinal('fragment', 'fragment')).toBe(0);
    expect(compareOrdinal('', '')).toBe(0);
  });

  it('returns a negative number when the left string precedes in UTF-16 code units', () => {
    expect(compareOrdinal('a', 'ab')).toBeLessThan(0);
    expect(compareOrdinal('', 'a')).toBeLessThan(0);
    expect(compareOrdinal('@x', 'B')).toBeLessThan(0);
    expect(compareOrdinal('\u{D800}', '\u{10000}')).toBeLessThan(0);
  });

  it('returns a positive number when the left string follows in UTF-16 code units', () => {
    expect(compareOrdinal('ab', 'a')).toBeGreaterThan(0);
    expect(compareOrdinal('b', 'B')).toBeGreaterThan(0);
    expect(compareOrdinal('_a', '[id]')).toBeGreaterThan(0);
    expect(compareOrdinal('\u{10000}', '\u{D800}')).toBeGreaterThan(0);
  });

  it('orders @, uppercase, brackets, underscore, and lowercase by code unit', () => {
    const values = ['b', 'B', '_a', '@x', '[id]'];
    const ordered = [...values];
    ordered.sort(compareOrdinal);

    expect(ordered).toEqual(['@x', 'B', '[id]', '_a', 'b']);
    expect(ordered).not.toEqual(values);
  });

  it('orders prefixes, empty strings, and non-ASCII code units', () => {
    const values = ['ab', 'a', '', 'ä', 'b'];
    const ordered = [...values];
    ordered.sort(compareOrdinal);

    expect(ordered).toEqual(['', 'a', 'ab', 'b', 'ä']);
  });
});
