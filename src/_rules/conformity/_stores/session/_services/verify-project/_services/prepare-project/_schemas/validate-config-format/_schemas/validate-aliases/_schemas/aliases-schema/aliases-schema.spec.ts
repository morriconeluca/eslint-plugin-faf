import { describe, expect, it } from 'vitest';

import { aliasesSchema } from './aliases-schema.schema.js';

describe('aliasesSchema', () => {
  it('accepts a literal alias map and rejects null', () => {
    expect(aliasesSchema.safeParse({ '#shared': 'src' }).success).toBe(true);
    expect(aliasesSchema.safeParse(null).success).toBe(false);
  });
});
