import { describe, expect, it } from 'vitest';

import { computeSccs } from './compute-sccs.util.js';

describe('computeSccs', () => {
  it('handles empty graph', () => {
    expect(computeSccs(0, [])).toEqual([]);
  });

  it('computes SCC for acyclic graph as singleton components', () => {
    const sccs = computeSccs(3, [[1], [2], []]);
    expect(sccs).toEqual([[0], [1], [2]]);
  });

  it('computes SCC for simple cycle', () => {
    const sccs = computeSccs(2, [[1], [0]]);
    expect(sccs).toHaveLength(1);
    expect(sccs[0]).toHaveLength(2);
  });
});
