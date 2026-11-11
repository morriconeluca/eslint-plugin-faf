import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { isExportsProperty } from './is-exports-property.util.js';

describe('isExportsProperty', () => {
  it('returns true when property is identifier exports and not computed', () => {
    const node: TAstNode = {
      computed: false,
      property: { name: 'exports', type: 'Identifier' },
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(true);
  });

  it('returns false when property is identifier with other name and not computed', () => {
    const node: TAstNode = {
      computed: false,
      property: { name: 'other', type: 'Identifier' },
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(false);
  });

  it('returns true when property is string literal exports and computed', () => {
    const node: TAstNode = {
      computed: true,
      property: { type: 'Literal', value: 'exports' },
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(true);
  });

  it('returns false when property is string literal with other name and computed', () => {
    const node: TAstNode = {
      computed: true,
      property: { type: 'Literal', value: 'other' },
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(false);
  });

  it('returns false when property is null', () => {
    const node: TAstNode = {
      computed: false,
      property: null,
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(false);
  });

  it('returns false when uncomputed property type is not identifier', () => {
    const node: TAstNode = {
      computed: false,
      property: { name: 'exports', type: 'Other' },
      type: 'MemberExpression',
    };
    expect(isExportsProperty(node)).toBe(false);
  });
});
