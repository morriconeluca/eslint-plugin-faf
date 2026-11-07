import { describe, expect, it } from 'vitest';

import { rolesSchema } from './roles-schema.schema.js';

describe('rolesSchema', () => {
  it('accepts a role and a group, and rejects null', () => {
    expect(
      rolesSchema.safeParse([{ category: '_utils', name: 'util' }]).success
    ).toBe(true);
    expect(rolesSchema.safeParse(null).success).toBe(false);
    expect(rolesSchema.safeParse([[]]).success).toBe(false);
  });
});
