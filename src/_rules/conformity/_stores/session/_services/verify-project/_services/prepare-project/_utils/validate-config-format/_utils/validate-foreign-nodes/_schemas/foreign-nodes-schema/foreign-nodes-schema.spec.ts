import { describe, expect, it } from 'vitest';

import { foreignNodesSchema } from './foreign-nodes-schema.schema.js';

describe('foreignNodesSchema', () => {
  it('accepts a path and a family, and rejects null', () => {
    expect(foreignNodesSchema.domains.safeParse(['src']).success).toBe(true);
    expect(foreignNodesSchema.nodes.safeParse(null).success).toBe(false);
    expect(
      foreignNodesSchema.nodes.safeParse([
        { paths: ['src'], patterns: ['*.md'] },
      ]).success
    ).toBe(true);
  });
});
