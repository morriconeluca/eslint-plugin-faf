import { describe, expect, it } from 'vitest';

import { readConfigValue } from './read-config-value.schema.js';

describe('readConfigValue', () => {
  it('reads a nested property and returns undefined when the path breaks', () => {
    expect(
      readConfigValue({ faf: { locals: ['src'] } }, ['faf', 'locals', 0])
    ).toBe('src');
    expect(readConfigValue({ faf: null }, ['faf', 'locals'])).toBeUndefined();
    expect(readConfigValue(['src'], [0])).toBe('src');
    expect(readConfigValue({ name: 'util' }, [Symbol('name')])).toBeUndefined();
    expect(readConfigValue({ 0: 'a' }, [0])).toBeUndefined();
    expect(readConfigValue({ name: 'util' }, ['missing'])).toBeUndefined();
  });
});
