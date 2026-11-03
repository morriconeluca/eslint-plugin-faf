import { describe, expect, it } from 'vitest';

import { isPlainRecord } from './is-plain-record.util.js';

describe('isPlainRecord', () => {
  it('returns true for plain objects', () => {
    const emptyRecord: unknown = {};
    expect(isPlainRecord(emptyRecord)).toBe(true);
    expect(isPlainRecord({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isPlainRecord(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isPlainRecord([])).toBe(false);
    expect(isPlainRecord([1, 2])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isPlainRecord('string')).toBe(false);
    expect(isPlainRecord(123)).toBe(false);
    expect(isPlainRecord(true)).toBe(false);
    expect(isPlainRecord(undefined)).toBe(false);
  });
});
