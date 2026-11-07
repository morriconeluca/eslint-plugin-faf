import { describe, expect, it } from 'vitest';

import { comparePaths } from './index.js';

describe('comparePaths', () => {
  it('compares identical paths as zero', () => {
    expect(comparePaths(['a', 'b'], ['a', 'b'])).toBe(0);
    expect(comparePaths([], [])).toBe(0);
  });

  it('orders earlier elements first', () => {
    expect(comparePaths(['a', 'b'], ['a', 'c'])).toBeLessThan(0);
    expect(comparePaths(['a', 'b'], ['z', 'b'])).toBeLessThan(0);
  });

  it('orders shorter paths first when prefix matches', () => {
    expect(comparePaths(['a'], ['a', 'b'])).toBeLessThan(0);
    expect(comparePaths([], ['a'])).toBeLessThan(0);
  });
});
