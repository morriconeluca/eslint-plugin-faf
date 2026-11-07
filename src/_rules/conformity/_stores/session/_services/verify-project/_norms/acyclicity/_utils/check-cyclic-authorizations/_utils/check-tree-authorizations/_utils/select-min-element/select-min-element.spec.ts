import { describe, expect, it } from 'vitest';

import { selectMinElement } from './index.js';

describe('selectMinElement', () => {
  it('returns the first element from non-empty array', () => {
    expect(selectMinElement(['a', 'b'])).toBe('a');
  });

  it('returns empty string when array is empty', () => {
    expect(selectMinElement([])).toBe('');
  });
});
