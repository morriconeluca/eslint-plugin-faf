import { describe, expect, it } from 'vitest';

import { buildRootAuthGraph } from './build-root-auth-graph.util.js';

describe('buildRootAuthGraph', () => {
  it('builds empty graph for empty trees', () => {
    expect(buildRootAuthGraph([]).fragCount).toBe(0);
  });
});
