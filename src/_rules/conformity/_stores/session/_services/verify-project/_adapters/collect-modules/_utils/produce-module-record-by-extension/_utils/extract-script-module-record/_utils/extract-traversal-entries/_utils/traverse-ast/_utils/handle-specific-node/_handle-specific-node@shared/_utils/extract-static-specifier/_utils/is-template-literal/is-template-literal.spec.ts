import { describe, expect, it } from 'vitest';

import { isTemplateLiteral } from './index.js';

describe('isTemplateLiteral', () => {
  it('returns true for TemplateLiteral node', () => {
    expect(isTemplateLiteral({ type: 'TemplateLiteral' })).toBe(true);
  });

  it('returns false for a non-template node a caller can produce', () => {
    expect(isTemplateLiteral({ type: 'Literal' })).toBe(false);
  });
});
