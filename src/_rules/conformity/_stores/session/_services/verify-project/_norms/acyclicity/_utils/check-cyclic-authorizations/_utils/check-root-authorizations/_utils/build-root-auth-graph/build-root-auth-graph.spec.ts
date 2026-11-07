import { describe, expect, it } from 'vitest';

import { buildRootAuthGraph } from './index.js';

describe('buildRootAuthGraph', () => {
  it('builds empty graph for empty trees', () => {
    expect(buildRootAuthGraph([]).fragCount).toBe(0);
  });
});
