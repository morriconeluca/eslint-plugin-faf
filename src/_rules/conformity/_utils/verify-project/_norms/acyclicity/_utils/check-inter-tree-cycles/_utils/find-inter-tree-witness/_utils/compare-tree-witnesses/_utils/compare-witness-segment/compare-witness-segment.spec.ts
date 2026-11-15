import { describe, expect, it } from 'vitest';

import { compareWitnessSegment } from './compare-witness-segment.util.js';

describe('compareWitnessSegment', () => {
  it('compares identical segments as zero', () => {
    expect(compareWitnessSegment(['a'], ['a'])).toBe(0);
    expect(compareWitnessSegment([], [])).toBe(0);
  });

  it('orders segments by source then destination', () => {
    expect(compareWitnessSegment(['a', 'b'], ['a', 'c'])).toBeLessThan(0);
    expect(compareWitnessSegment(['a', 'b'], ['b', 'b'])).toBeLessThan(0);
    expect(compareWitnessSegment([], ['a'])).toBeLessThan(0);
  });
});
