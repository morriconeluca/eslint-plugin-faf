import { describe, expect, it } from 'vitest';

import { dependenciesSchema } from './dependencies-schema.schema.js';

describe('dependenciesSchema', () => {
  it('accepts a public root node and a dependency pair', () => {
    expect(
      dependenciesSchema.publicRootNodes.safeParse(['src/main.ts']).success
    ).toBe(true);
    expect(
      dependenciesSchema.pairs.safeParse([{ from: ['src'], to: ['lib'] }])
        .success
    ).toBe(true);
    expect(dependenciesSchema.pairs.safeParse(null).success).toBe(false);
  });
});
