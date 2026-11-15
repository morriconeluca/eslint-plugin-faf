import { describe, expect, it } from 'vitest';

import { reconstructTreeCycle } from './reconstruct-tree-cycle.util.js';

describe('reconstructTreeCycle', () => {
  it('reconstructs cycle of tree indices for 2-node cycle', () => {
    const parent = new Int32Array([-1, 0]);
    expect(reconstructTreeCycle(0, 1, parent)).toEqual([0, 1, 0]);
  });

  it('reconstructs cycle of tree indices for 3-node cycle', () => {
    const parent = new Int32Array([-1, 0, 1]);
    expect(reconstructTreeCycle(0, 2, parent)).toEqual([0, 1, 2, 0]);
  });

  it('stops when parent link is missing (-1) or out of bounds', () => {
    const parent = new Int32Array([-1, -1]);
    expect(reconstructTreeCycle(0, 1, parent)).toEqual([0, 1, 0]);
    expect(reconstructTreeCycle(0, 100, parent)).toEqual([0, 100, 0]);
  });
});
