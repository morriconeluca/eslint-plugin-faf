import { describe, expect, it } from 'vitest';

import { buildTransposeGraph } from './build-transpose-graph.util.js';

describe('buildTransposeGraph', () => {
  it('transposes edges', () => {
    expect(buildTransposeGraph(2, [[1], []])).toEqual([[], [0]]);
  });

  it('handles missing rows and out-of-range neighbor indices', () => {
    expect(buildTransposeGraph(2, [[99]])).toEqual([[], []]);
  });
});
