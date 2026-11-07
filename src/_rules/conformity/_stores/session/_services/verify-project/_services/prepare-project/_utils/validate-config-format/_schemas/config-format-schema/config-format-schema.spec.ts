import { describe, expect, it } from 'vitest';

import { configFormatSchema } from './config-format-schema.schema.js';

describe('configFormatSchema', () => {
  it('accepts one local origin and rejects an unknown root property', () => {
    expect(
      configFormatSchema.safeParse({
        faf: { locals: [{ rootLayers: ['src'] }] },
      }).success
    ).toBe(true);
    expect(configFormatSchema.safeParse({ trees: [] }).success).toBe(false);
    expect(
      configFormatSchema.safeParse({ faf: { locals: [{}] } }).success
    ).toBe(false);
    expect(configFormatSchema.safeParse(null).success).toBe(false);
    expect(
      configFormatSchema.safeParse({
        faf: {
          locals: [{}, { rootLayers: ['src'] }],
        },
      }).success
    ).toBe(false);
  });
});
