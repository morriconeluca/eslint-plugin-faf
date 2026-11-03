import { describe, expect, it } from 'vitest';

import { isTemplateLiteral } from './index.js';

describe('isTemplateLiteral', () => {
  it('returns true for TemplateLiteral node', () => {
    expect(isTemplateLiteral({ type: 'TemplateLiteral' })).toBe(true);
  });

  it('returns false for other nodes or primitives', () => {
    expect(isTemplateLiteral({ type: 'Literal' })).toBe(false);
    expect(isTemplateLiteral(null)).toBe(false);
    expect(isTemplateLiteral('TemplateLiteral')).toBe(false);
  });
});
