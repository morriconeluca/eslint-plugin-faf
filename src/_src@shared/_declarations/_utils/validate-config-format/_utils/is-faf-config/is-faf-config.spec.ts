import { describe, expect, it } from 'vitest';

import { isFafConfig } from './is-faf-config.util.js';

describe('isFafConfig', () => {
  it('returns true when outcomeCount is zero', () => {
    expect(isFafConfig({}, 0)).toBe(true);
  });

  it('returns false when outcomeCount is non-zero', () => {
    expect(isFafConfig({}, 1)).toBe(false);
    expect(isFafConfig({}, 5)).toBe(false);
  });
});
