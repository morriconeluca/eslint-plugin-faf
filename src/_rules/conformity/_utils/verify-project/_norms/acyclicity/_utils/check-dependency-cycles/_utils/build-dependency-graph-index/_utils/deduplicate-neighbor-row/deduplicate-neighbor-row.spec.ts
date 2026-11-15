import { describe, expect, it } from 'vitest';

import { deduplicateNeighborRow } from './deduplicate-neighbor-row.util.js';

describe('deduplicateNeighborRow', () => {
  it('deduplicates and sorts numbers', () => {
    expect(deduplicateNeighborRow([2, 1, 2, 0])).toEqual([0, 1, 2]);
  });
});
