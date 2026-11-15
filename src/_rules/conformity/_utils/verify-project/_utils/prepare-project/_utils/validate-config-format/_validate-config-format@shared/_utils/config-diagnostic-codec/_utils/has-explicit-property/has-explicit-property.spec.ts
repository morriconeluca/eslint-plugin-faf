import { describe, expect, it } from 'vitest';

import { hasExplicitProperty } from './has-explicit-property.util.js';

describe('hasExplicitProperty', () => {
  it('rejects a null parent and a missing key', () => {
    expect(hasExplicitProperty(null, 'roles')).toBe(false);
    expect(hasExplicitProperty({ name: 'util' }, 'category')).toBe(false);
    expect(hasExplicitProperty({ name: 'util' }, 0)).toBe(false);
  });

  it('detects a present key and rejects arrays', () => {
    const record: Record<string, null> = {};
    Object.defineProperty(record, 'roles', {
      enumerable: true,
      value: void 0,
    });
    expect(hasExplicitProperty(record, 'roles')).toBe(true);
    expect(hasExplicitProperty([], 0)).toBe(false);
  });
});
