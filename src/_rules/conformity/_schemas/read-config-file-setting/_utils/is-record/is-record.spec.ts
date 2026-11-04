import { describe, expect, it } from 'vitest';

import { isRecord } from './index.js';

describe('isRecord', () => {
  it('accepts plain objects and rejects arrays, null, and primitives', () => {
    expect(isRecord({ faf: true })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('faf')).toBe(false);
  });
});
