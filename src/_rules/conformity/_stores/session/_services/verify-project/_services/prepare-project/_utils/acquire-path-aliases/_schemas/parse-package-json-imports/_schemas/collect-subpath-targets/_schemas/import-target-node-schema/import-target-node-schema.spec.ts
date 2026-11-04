import { describe, expect, it } from 'vitest';

import { importTargetNodeSchema } from './import-target-node-schema.schema.js';

describe('importTargetNodeSchema', () => {
  it('accepts a string target and rejects a number', () => {
    expect(importTargetNodeSchema.safeParse('./src/main.ts').success).toBe(
      true
    );
    expect(importTargetNodeSchema.safeParse(1).success).toBe(false);
  });
});
