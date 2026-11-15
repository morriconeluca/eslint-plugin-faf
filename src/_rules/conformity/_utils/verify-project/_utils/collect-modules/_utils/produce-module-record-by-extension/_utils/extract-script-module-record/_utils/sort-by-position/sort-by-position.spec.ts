import { describe, expect, it } from 'vitest';

import { sortByPosition } from './sort-by-position.util.js';

describe('sortByPosition', () => {
  it('returns empty array when input is empty', () => {
    expect(sortByPosition([])).toEqual([]);
  });

  it('preserves single item', () => {
    const item = { id: 'a', position: { column: 5, line: 2 } };
    expect(sortByPosition([item])).toEqual([item]);
  });

  it('sorts items by line ascending', () => {
    const first = { id: 'first', position: { column: 1, line: 1 } };
    const second = { id: 'second', position: { column: 1, line: 2 } };
    const third = { id: 'third', position: { column: 1, line: 3 } };

    expect(sortByPosition([third, first, second])).toEqual([
      first,
      second,
      third,
    ]);
  });

  it('sorts items by column ascending when lines are equal', () => {
    const first = { id: 'first', position: { column: 2, line: 4 } };
    const second = { id: 'second', position: { column: 8, line: 4 } };
    const third = { id: 'third', position: { column: 15, line: 4 } };

    expect(sortByPosition([third, second, first])).toEqual([
      first,
      second,
      third,
    ]);
  });

  it('preserves relative order when positions are identical', () => {
    const first = { id: 'first', position: { column: 5, line: 2 } };
    const second = { id: 'second', position: { column: 5, line: 2 } };
    const reversed = [second, first];

    expect(sortByPosition([first, second]).map((item) => item.id)).toEqual([
      'first',
      'second',
    ]);
    expect(sortByPosition(reversed).map((item) => item.id)).toEqual([
      'second',
      'first',
    ]);
  });

  it('does not mutate the received array', () => {
    const items = [
      { id: 'later', position: { column: 1, line: 2 } },
      { id: 'earlier', position: { column: 1, line: 1 } },
    ];
    const snapshot = [...items];

    expect(sortByPosition(items)).toEqual([items[1], items[0]]);
    expect(items).toEqual(snapshot);
  });
});
