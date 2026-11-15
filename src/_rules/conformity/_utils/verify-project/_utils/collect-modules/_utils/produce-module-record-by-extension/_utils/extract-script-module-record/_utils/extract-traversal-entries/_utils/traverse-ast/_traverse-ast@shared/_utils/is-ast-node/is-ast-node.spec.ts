import { describe, expect, it } from 'vitest';

import { isAstNode } from './is-ast-node.util.js';

describe('isAstNode', () => {
  it('returns true for object with string type', () => {
    expect(isAstNode({ type: 'Identifier', value: 'foo' })).toBe(true);
  });

  it('returns false for null or primitives', () => {
    expect(isAstNode(null)).toBe(false);
    expect(isAstNode(undefined)).toBe(false);
    expect(isAstNode(123)).toBe(false);
    expect(isAstNode('string')).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isAstNode([])).toBe(false);
  });

  it('returns false for object without type property or non-string type', () => {
    expect(isAstNode({ name: 'foo' })).toBe(false);
    expect(isAstNode({ type: 123 })).toBe(false);
  });
});
