import { describe, expect, it } from 'vitest';

import { dedupeSourceLocations } from './dedupe-source-locations.util.js';

describe('dedupeSourceLocations', () => {
  it('returns empty array when input is empty', () => {
    expect(dedupeSourceLocations([])).toEqual([]);
  });

  it('preserves single location', () => {
    expect(dedupeSourceLocations([{ column: 1, line: 1 }])).toEqual([
      { column: 1, line: 1 },
    ]);
  });

  it('sorts and deduplicates locations with identical coordinates', () => {
    const input = [
      { column: 1, line: 3 },
      { column: 1, line: 1 },
      { column: 1, line: 1 },
      { column: 5, line: 2 },
      { column: 1, line: 2 },
    ];

    expect(dedupeSourceLocations(input)).toEqual([
      { column: 1, line: 1 },
      { column: 1, line: 2 },
      { column: 5, line: 2 },
      { column: 1, line: 3 },
    ]);
  });
});
