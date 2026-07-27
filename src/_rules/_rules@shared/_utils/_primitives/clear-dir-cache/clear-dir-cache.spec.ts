import { describe, expect, it } from 'vitest';

import { state } from '#_utils@shared/_stores/cache/index.js';

import { clearDirCache } from './clear-dir-cache.util.js';

describe('clearDirCache', () => {
  it('should reset cache store state', () => {
    state.dirCache['foo'] = { dirs: [], files: [] };
    state.classifyCache.set('bar', 'category');
    state.packageImports = { foo: 'bar' };

    clearDirCache();

    expect(state.dirCache).toEqual({});
    expect(state.classifyCache.size).toBe(0);
    expect(state.packageImports).toBeNull();
  });
});
