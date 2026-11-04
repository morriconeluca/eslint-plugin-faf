import { describe, expect, it } from 'vitest';

import { configShape } from './config-shape.schema.js';

describe('configShape', () => {
  it('accepts a local object with one origin field', () => {
    expect(
      configShape.root.safeParse({
        faf: { locals: [{ rootLayers: ['src'] }] },
      }).success
    ).toBe(true);
  });
});
