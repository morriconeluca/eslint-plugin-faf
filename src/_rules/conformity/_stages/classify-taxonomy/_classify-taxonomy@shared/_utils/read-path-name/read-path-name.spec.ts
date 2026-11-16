import { describe, expect, it } from 'vitest';

import { readPathName } from './read-path-name.util.js';

describe('readPathName', () => {
  it('returns the terminal segment of nested POSIX paths', () => {
    expect(readPathName('src/_utils/format-label/index.ts')).toBe('index.ts');
    expect(readPathName('src/_components/button')).toBe('button');
  });

  it('returns the entire string when no slash is present and empty string on trailing slash', () => {
    expect(readPathName('main.ts')).toBe('main.ts');
    expect(readPathName('')).toBe('');
    expect(readPathName('src/')).toBe('');
  });
});
