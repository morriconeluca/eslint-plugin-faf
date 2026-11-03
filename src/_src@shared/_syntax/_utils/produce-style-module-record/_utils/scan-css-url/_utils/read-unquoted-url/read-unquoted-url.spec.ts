import { describe, expect, it } from 'vitest';

import { readUnquotedUrl } from './read-unquoted-url.util.js';

describe('readUnquotedUrl', () => {
  it('reads unquoted url until closing parenthesis', () => {
    const text = 'images/icon.png) rest';
    const result = readUnquotedUrl(text, 0);

    expect(result.raw).toBe('images/icon.png');
    expect(result.nextIndex).toBe(16);
  });

  it('reads unquoted url with nested parentheses like var()', () => {
    const text = 'var(--bg-url)) rest';
    const result = readUnquotedUrl(text, 0);

    expect(result.raw).toBe('var(--bg-url)');
    expect(result.nextIndex).toBe(14);
  });

  it('handles unquoted url reaching EOF without closing parenthesis', () => {
    const text = 'unclosed-url-at-eof';
    const result = readUnquotedUrl(text, 0);

    expect(result.raw).toBe('unclosed-url-at-eof');
    expect(result.nextIndex).toBe(text.length);
  });
});
