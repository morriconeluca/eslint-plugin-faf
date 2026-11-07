import { describe, expect, it } from 'vitest';

import { computeFinishStack } from './compute-finish-stack.util.js';

describe('computeFinishStack', () => {
  it('computes finish stack for single node', () => {
    expect(computeFinishStack(1, [[]])).toEqual([0]);
  });

  it('computes finish stack for multi-node graph with disconnected components', () => {
    expect(computeFinishStack(3, [[1], [], []])).toEqual([1, 0, 2]);
  });

  it('skips already visited roots', () => {
    expect(computeFinishStack(2, [[1], []])).toEqual([1, 0]);
  });
});
