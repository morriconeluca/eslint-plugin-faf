import { describe, expect, it } from 'vitest';

import { compareSegmentElements } from './index.js';

describe('compareSegmentElements', () => {
  it('compares identical segments as zero', () => {
    expect(compareSegmentElements(['a', 'b'], ['a', 'b'])).toBe(0);
  });

  it('orders segments with earlier elements first', () => {
    expect(compareSegmentElements(['a', 'b'], ['a', 'c'])).toBeLessThan(0);
    expect(compareSegmentElements(['a', 'b'], ['z', 'b'])).toBeLessThan(0);
  });

  it('orders shorter segments first when prefix is equal', () => {
    expect(compareSegmentElements(['a'], ['a', 'b'])).toBeLessThan(0);
  });
});
