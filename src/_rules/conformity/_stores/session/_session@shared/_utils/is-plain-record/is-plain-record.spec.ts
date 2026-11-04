import { describe, expect, it } from 'vitest';

import { isPlainRecord } from './index.js';

describe('isPlainRecord', () => {
  it('returns true for plain objects', () => {
    const emptyRecord: unknown = {};
    const populatedRecord: unknown = { a: 1 };

    expect(isPlainRecord(emptyRecord)).toBe(true);
    expect(isPlainRecord(populatedRecord)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isPlainRecord(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    const emptyList: unknown = [];
    const populatedList: unknown = [1, 2, 3];

    expect(isPlainRecord(emptyList)).toBe(false);
    expect(isPlainRecord(populatedList)).toBe(false);
  });

  it('returns false for primitives', () => {
    const text: unknown = 'string';
    const amount: unknown = 123;
    const flag: unknown = true;

    expect(isPlainRecord(text)).toBe(false);
    expect(isPlainRecord(amount)).toBe(false);
    expect(isPlainRecord(flag)).toBe(false);
    expect(isPlainRecord(undefined)).toBe(false);
  });
});
