import { describe, expect, it } from 'vitest';

import { subGraphRolesSchema } from './sub-graph-roles-schema.schema.js';

describe('subGraphRolesSchema', () => {
  it('accepts a named role and rejects null', () => {
    expect(subGraphRolesSchema.safeParse([{ name: 'test' }]).success).toBe(
      true
    );
    expect(subGraphRolesSchema.safeParse(null).success).toBe(false);
    expect(subGraphRolesSchema.safeParse([{ extra: true }]).success).toBe(
      false
    );
  });
});
