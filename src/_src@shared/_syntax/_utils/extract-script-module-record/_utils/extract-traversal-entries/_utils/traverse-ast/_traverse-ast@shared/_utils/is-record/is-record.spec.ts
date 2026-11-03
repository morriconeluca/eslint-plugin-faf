import { describe, expect, it } from 'vitest';

import { isRecord } from './index.js';

describe('isRecord', () => {
  it('returns true for plain object', () => {
    expect(isRecord({ foo: 'bar' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for array', () => {
    expect(isRecord([])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord(123)).toBe(false);
    expect(isRecord('test')).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});
