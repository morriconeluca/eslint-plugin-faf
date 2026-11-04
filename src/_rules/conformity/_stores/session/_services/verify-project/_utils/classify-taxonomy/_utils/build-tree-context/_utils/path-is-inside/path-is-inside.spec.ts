import { describe, expect, it } from 'vitest';

import { isPathInside } from './index.js';

describe('isPathInside', () => {
  it('matches a path equal to an ancestor and a strict descendant', () => {
    const ancestors = new Set(['src/_tooling']);
    expect(isPathInside('src/_tooling', ancestors)).toBe(true);
    expect(isPathInside('src/_tooling/nested', ancestors)).toBe(true);
    expect(isPathInside('src/_tooling-extra', ancestors)).toBe(false);
    expect(isPathInside('other', ancestors)).toBe(false);
  });
});
