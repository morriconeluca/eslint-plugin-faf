import { describe, expect, it } from 'vitest';

import { compareSegments } from './index.js';

describe('compareSegments', () => {
  it('orders segments with earlier sources first even if destinations are reversed', () => {
    expect(compareSegments(['a.ts', 'z.ts'], ['b.ts', 'a.ts'])).toBeLessThan(0);
    expect(compareSegments(['b.ts', 'a.ts'], ['a.ts', 'z.ts'])).toBeGreaterThan(
      0
    );
  });

  it('orders segments by destination when sources match even if intermediate elements are reversed', () => {
    expect(
      compareSegments(['a.ts', 'z.ts', 'b.ts'], ['a.ts', 'a.ts', 'c.ts'])
    ).toBeLessThan(0);
    expect(
      compareSegments(['a.ts', 'a.ts', 'c.ts'], ['a.ts', 'z.ts', 'b.ts'])
    ).toBeGreaterThan(0);
  });

  it('orders by intermediate elements when source and destination both match', () => {
    expect(
      compareSegments(['a.ts', 'b.ts', 'd.ts'], ['a.ts', 'c.ts', 'd.ts'])
    ).toBeLessThan(0);
  });

  it('compares identical segments as zero', () => {
    expect(compareSegments(['a.ts', 'b.ts'], ['a.ts', 'b.ts'])).toBe(0);
  });

  it('handles empty segments fallback', () => {
    expect(compareSegments([], [])).toBe(0);
    expect(compareSegments([], ['a.ts'])).toBeLessThan(0);
    expect(compareSegments(['a.ts'], [])).toBeGreaterThan(0);
  });
});
