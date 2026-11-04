import { describe, expect, it } from 'vitest';

import { isStringDirectChild } from './is-string-direct-child.util.js';

describe('isStringDirectChild', () => {
  it('rejects an empty name and a nested name under the codebase root', () => {
    expect(isStringDirectChild('', '.')).toBe(false);
    expect(isStringDirectChild('src/app', '.')).toBe(false);
    expect(isStringDirectChild('src', '.')).toBe(true);
  });

  it('rejects a path outside the parent prefix or that skips a segment', () => {
    expect(isStringDirectChild('lib', 'src')).toBe(false);
    expect(isStringDirectChild('src/app/routes', 'src')).toBe(false);
    expect(isStringDirectChild('src/app', 'src')).toBe(true);
  });
});
