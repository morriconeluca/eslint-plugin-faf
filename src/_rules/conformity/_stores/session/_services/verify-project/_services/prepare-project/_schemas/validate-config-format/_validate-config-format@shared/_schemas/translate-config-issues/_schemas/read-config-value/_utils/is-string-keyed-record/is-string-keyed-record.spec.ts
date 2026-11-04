import { describe, expect, it } from 'vitest';

import { isStringKeyedRecord } from './is-string-keyed-record.util.js';

describe('isStringKeyedRecord', () => {
  it('accepts an object key and rejects an array', () => {
    expect(isStringKeyedRecord({ name: 'util' }, 'name')).toBe(true);
    expect(isStringKeyedRecord(['util'], 0)).toBe(false);
    expect(isStringKeyedRecord(null, 'name')).toBe(false);
    expect(isStringKeyedRecord({ name: 'util' }, Symbol('name'))).toBe(false);
    expect(isStringKeyedRecord({ name: 'util' }, 'missing')).toBe(false);
    expect(isStringKeyedRecord(1, 'name')).toBe(false);
    expect(isStringKeyedRecord('name', 'length')).toBe(false);
  });
});
