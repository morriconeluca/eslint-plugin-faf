import { describe, expect, it } from 'vitest';

import { rootLayersSchema } from './root-layers-schema.schema.js';

describe('rootLayersSchema', () => {
  it('accepts a non-empty literal path and rejects null', () => {
    expect(rootLayersSchema.safeParse(['src']).success).toBe(true);
    expect(rootLayersSchema.safeParse(null).success).toBe(false);
    expect(rootLayersSchema.safeParse(['']).success).toBe(false);
  });
});
