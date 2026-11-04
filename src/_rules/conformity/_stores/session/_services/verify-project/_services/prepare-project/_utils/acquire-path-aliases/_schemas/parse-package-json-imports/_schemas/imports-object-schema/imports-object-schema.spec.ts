import { describe, expect, it } from 'vitest';

import { importsObjectSchema } from './imports-object-schema.schema.js';

describe('importsObjectSchema', () => {
  it('accepts a JSON object and rejects an array', () => {
    expect(
      importsObjectSchema.safeParse({ '#entry': './src/main.ts' }).success
    ).toBe(true);
    expect(importsObjectSchema.safeParse([]).success).toBe(false);
    expect(importsObjectSchema.safeParse(null).success).toBe(false);
    expect(importsObjectSchema.safeParse('imports').success).toBe(false);
  });
});
