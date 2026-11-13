import { describe, expect, it } from 'vitest';

import { buildRootAuthorizationGraph } from './build-root-authorization-graph.util.js';

describe('buildRootAuthorizationGraph', () => {
  it('builds empty graph for empty trees', () => {
    expect(buildRootAuthorizationGraph([]).fragmentCount).toBe(0);
  });
});
