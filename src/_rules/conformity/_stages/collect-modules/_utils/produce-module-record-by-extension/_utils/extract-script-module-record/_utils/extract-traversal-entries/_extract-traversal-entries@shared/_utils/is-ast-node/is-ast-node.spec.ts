import { describe, expect, it } from 'vitest';

import { isAstNode } from './is-ast-node.util.js';

describe('isAstNode', () => {
  it('detects objects with string type property and rejects primitives or arrays', () => {
    const valid: unknown = { type: 'Identifier' };
    const numericType: unknown = { type: 123 };
    const nullValue: unknown = null;
    const arrayValue: unknown = ['Identifier'];

    expect(isAstNode(valid)).toBe(true);
    expect(isAstNode(numericType)).toBe(false);
    expect(isAstNode(nullValue)).toBe(false);
    expect(isAstNode(arrayValue)).toBe(false);
  });
});
