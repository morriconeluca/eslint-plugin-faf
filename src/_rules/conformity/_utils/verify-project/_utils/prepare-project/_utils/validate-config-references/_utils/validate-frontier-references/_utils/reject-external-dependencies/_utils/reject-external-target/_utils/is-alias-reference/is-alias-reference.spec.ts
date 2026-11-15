import { describe, expect, it } from 'vitest';

import { isAliasReference } from './is-alias-reference.util.js';

describe('isAliasReference', () => {
  it('matches an alias prefix at a segment boundary and ignores unrelated paths', () => {
    expect(isAliasReference('#shared', ['#shared'])).toBe(true);
    expect(isAliasReference('#shared/file.ts', ['#shared'])).toBe(true);
    expect(isAliasReference('#sharedness/file.ts', ['#shared'])).toBe(false);
    expect(isAliasReference('src/file.ts', [])).toBe(false);
  });
});
