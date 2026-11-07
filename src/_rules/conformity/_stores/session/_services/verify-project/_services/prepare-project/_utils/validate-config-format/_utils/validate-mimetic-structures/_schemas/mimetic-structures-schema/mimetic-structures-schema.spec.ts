import { describe, expect, it } from 'vitest';

import { mimeticStructuresSchema } from './mimetic-structures-schema.schema.js';

describe('mimeticStructuresSchema', () => {
  it('accepts a structure with a non-empty action string', () => {
    expect(
      mimeticStructuresSchema.safeParse([
        { actions: ['get'], paths: ['src/_apis'] },
      ]).success
    ).toBe(true);
    expect(mimeticStructuresSchema.safeParse(null).success).toBe(false);
  });
});
