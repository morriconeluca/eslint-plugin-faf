import { describe, expect, it } from 'vitest';

import { isBindingPattern } from './is-binding-pattern.util.js';

describe('isBindingPattern', () => {
  it.each([
    'ArrayPattern',
    'AssignmentPattern',
    'Identifier',
    'ObjectPattern',
    'RestElement',
  ])('returns true for %s', (type) => {
    expect(isBindingPattern({ type })).toBe(true);
  });

  it('returns false for other node types or non-objects', () => {
    expect(isBindingPattern({ type: 'FunctionDeclaration' })).toBe(false);
    expect(isBindingPattern(null)).toBe(false);
    expect(isBindingPattern('Identifier')).toBe(false);
  });
});
