import { describe, expect, it } from 'vitest';

import { configShape } from './config-shape.schema.js';

describe('configShape', () => {
  it('accepts a local object with one origin field and horizontalHierarchies', () => {
    expect(
      configShape.root.safeParse({
        faf: {
          common: { subCategoryHierarchies: [] },
          locals: [{ horizontalHierarchies: [], rootLayers: ['src'] }],
        },
      }).success
    ).toBe(true);
  });

  it('rejects removed localHorizontalHierarchies as unknown property', () => {
    expect(
      configShape.root.safeParse({
        faf: {
          locals: [{ localHorizontalHierarchies: [], rootLayers: ['src'] }],
        },
      }).success
    ).toBe(false);
  });
});
