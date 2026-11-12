import { describe, expect, it } from 'vitest';

import { aliasesSchema } from './aliases-schema.schema.js';

describe('aliasesSchema', () => {
  it('accepts a literal alias map and rejects null', () => {
    expect(aliasesSchema.safeParse({ '#shared': 'src' }).success).toBe(true);
    expect(aliasesSchema.safeParse(null).success).toBe(false);
  });

  it('rejects null and non-string values', () => {
    expect(aliasesSchema.safeParse({ '#shared': null }).success).toBe(false);
    expect(aliasesSchema.safeParse({ '#shared': 123 }).success).toBe(false);
  });

  it('rejects empty key and empty value', () => {
    expect(aliasesSchema.safeParse({ '': 'src' }).success).toBe(false);
    expect(aliasesSchema.safeParse({ '#shared': '' }).success).toBe(false);
  });

  it('rejects trailing slash in key', () => {
    const result = aliasesSchema.safeParse({ '#shared/': 'src' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'configuration/invalid-alias-key'
      );
    }
  });

  it('rejects wildcard asterisk in key', () => {
    const result = aliasesSchema.safeParse({ '#shared/*': 'src' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'configuration/invalid-alias-key'
      );
    }
  });

  it('rejects wildcard asterisk in value', () => {
    const result = aliasesSchema.safeParse({ '#shared': 'src/*' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'configuration/invalid-literal-path'
      );
    }
  });

  it('rejects non-literal path in value', () => {
    const result = aliasesSchema.safeParse({ '#shared': '/src' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        'configuration/invalid-literal-path'
      );
    }
  });
});
