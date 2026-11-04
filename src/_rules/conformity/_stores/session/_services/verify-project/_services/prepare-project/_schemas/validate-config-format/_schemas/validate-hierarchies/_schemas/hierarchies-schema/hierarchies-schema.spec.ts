import { describe, expect, it } from 'vitest';

import { hierarchiesSchema } from './hierarchies-schema.schema.js';

describe('hierarchiesSchema', () => {
  it('accepts an empty horizontal list and a local hierarchy', () => {
    expect(hierarchiesSchema.horizontal.safeParse([]).success).toBe(true);
    expect(hierarchiesSchema.horizontal.safeParse(null).success).toBe(false);
    expect(
      hierarchiesSchema.local.safeParse([
        { hierarchies: [['_types']], paths: ['src'] },
      ]).success
    ).toBe(true);
  });
});
