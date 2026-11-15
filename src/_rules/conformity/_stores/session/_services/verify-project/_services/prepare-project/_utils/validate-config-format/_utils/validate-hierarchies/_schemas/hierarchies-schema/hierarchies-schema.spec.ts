import { describe, expect, it } from 'vitest';

import { hierarchiesSchema } from './hierarchies-schema.schema.js';

describe('hierarchiesSchema', () => {
  it('validates horizontalHierarchyModels and horizontalHierarchies', () => {
    expect(hierarchiesSchema.models.safeParse([]).success).toBe(true);
    expect(
      hierarchiesSchema.models.safeParse([[['_atoms'], ['_molecules']]]).success
    ).toBe(true);
    expect(hierarchiesSchema.models.safeParse([[['_atoms']]]).success).toBe(
      false
    );
    expect(
      hierarchiesSchema.models.safeParse([[['atoms'], ['_molecules']]]).success
    ).toBe(false);
    expect(hierarchiesSchema.models.safeParse(null).success).toBe(false);

    expect(hierarchiesSchema.horizontal.safeParse([]).success).toBe(true);
    expect(
      hierarchiesSchema.horizontal.safeParse([
        { hierarchy: [['_types'], ['_utils']], path: 'src' },
      ]).success
    ).toBe(true);
    expect(
      hierarchiesSchema.horizontal.safeParse([
        { hierarchy: [['_types']], path: 'src' },
      ]).success
    ).toBe(false);
    expect(hierarchiesSchema.horizontal.safeParse(null).success).toBe(false);
  });
});
