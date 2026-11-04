import { describe, expect, it } from 'vitest';

import { isStatement } from './index.js';

describe('isStatement', () => {
  it('returns true for statement object with type string', () => {
    expect(isStatement({ type: 'VariableDeclaration' })).toBe(true);
  });

  it('returns false for non-statement objects or primitives', () => {
    expect(isStatement(null)).toBe(false);
    expect(isStatement([])).toBe(false);
    expect(isStatement({ name: 'foo' })).toBe(false);
  });
});
