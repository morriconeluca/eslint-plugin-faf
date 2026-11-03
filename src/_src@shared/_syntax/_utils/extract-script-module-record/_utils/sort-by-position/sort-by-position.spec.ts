import { describe, expect, it } from 'vitest';

import { sortByPosition } from './index.js';

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

  it('handles identical positions stably', () => {
    const first = { id: 'first', position: { column: 5, line: 2 } };
    const second = { id: 'second', position: { column: 5, line: 2 } };

    const result = sortByPosition([first, second]);
    expect(result).toHaveLength(2);
    expect(result[0]?.position).toEqual({ column: 5, line: 2 });
    expect(result[1]?.position).toEqual({ column: 5, line: 2 });
  });
});
