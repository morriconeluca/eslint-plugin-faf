import { describe, expect, it } from 'vitest';

import { readUnquotedUrl } from './read-unquoted-url.util.js';

describe('readUnquotedUrl', () => {
  it('reads unquoted url until closing parenthesis', () => {
    const text = 'theme.css) rest';
    const result = readUnquotedUrl(text, 0);

    expect(result.raw).toBe('theme.css');
    expect(result.nextIndex).toBe(10);
  });

  it('reads unquoted url with nested parentheses like var()', () => {
    const text = 'var(--theme)) rest';
    const result = readUnquotedUrl(text, 0);

    expect(result.raw).toBe('var(--theme)');
    expect(result.nextIndex).toBe(13);
  });
});
