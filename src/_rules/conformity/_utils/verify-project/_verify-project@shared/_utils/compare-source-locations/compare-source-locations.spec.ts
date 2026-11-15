import { describe, expect, it } from 'vitest';

import { compareSourceLocations } from './compare-source-locations.util.js';

describe('compareSourceLocations', () => {
  it('returns zero when line and column are equal', () => {
    expect(
      compareSourceLocations({ column: 4, line: 2 }, { column: 4, line: 2 })
    ).toBe(0);
  });

  it('returns a negative number when the left line precedes the right line', () => {
    expect(
      compareSourceLocations({ column: 9, line: 1 }, { column: 1, line: 2 })
    ).toBeLessThan(0);
  });

  it('returns a positive number when the left line follows the right line', () => {
    expect(
      compareSourceLocations({ column: 1, line: 3 }, { column: 8, line: 2 })
    ).toBeGreaterThan(0);
  });

  it('returns a negative number when lines match and the left column precedes', () => {
    expect(
      compareSourceLocations({ column: 2, line: 4 }, { column: 8, line: 4 })
    ).toBeLessThan(0);
  });

  it('returns a positive number when lines match and the left column follows', () => {
    expect(
      compareSourceLocations({ column: 15, line: 4 }, { column: 2, line: 4 })
    ).toBeGreaterThan(0);
  });

  it('orders locations by line and then by column, preserving equals', () => {
    const third = { id: 'third', position: { column: 1, line: 3 } };
    const first = { id: 'first', position: { column: 1, line: 1 } };
    const second = { id: 'second', position: { column: 8, line: 1 } };
    const tied = { id: 'tied', position: { column: 1, line: 1 } };
    const shuffled = [third, tied, second, first];
    const reversed = [first, second, tied, third];
    const orderedFromShuffle = [...shuffled];
    const orderedFromReverse = [...reversed];
    orderedFromShuffle.sort((left, right) =>
      compareSourceLocations(left.position, right.position)
    );
    orderedFromReverse.sort((left, right) =>
      compareSourceLocations(left.position, right.position)
    );

    expect(orderedFromShuffle.map((item) => item.id)).toEqual([
      'tied',
      'first',
      'second',
      'third',
    ]);
    expect(orderedFromReverse.map((item) => item.id)).toEqual([
      'first',
      'tied',
      'second',
      'third',
    ]);
  });
});
