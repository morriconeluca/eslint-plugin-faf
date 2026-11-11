import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TAstNode } from '../../../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { isCommonJsExportAssignment } from './is-commonjs-export-assignment.util.js';

const parseLeft = (code: string): TAstNode => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement !== undefined, 'Expected statement');
  assertInvariant(
    statement.type === 'ExpressionStatement',
    'Expected expression'
  );
  assertInvariant(
    statement.expression.type === 'AssignmentExpression',
    'Expected assignment'
  );
  const left = statement.expression.left;
  return { ...left, type: left.type };
};

describe('isCommonJsExportAssignment', () => {
  it.each([
    {
      code: 'exports.foo = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'exports.foo unshadowed',
    },
    {
      code: 'exports["foo"] = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'exports["foo"] unshadowed',
    },
    {
      code: 'exports.foo.bar = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'exports.foo.bar unshadowed',
    },
    {
      code: 'module.exports = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.exports unshadowed',
    },
    {
      code: 'module["exports"] = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module["exports"] unshadowed',
    },
    {
      code: 'module.exports.foo = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.exports.foo unshadowed',
    },
    {
      code: 'module["exports"].foo = 1;',
      expected: true,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module["exports"].foo unshadowed',
    },
    {
      code: 'exports.foo = 1;',
      expected: false,
      isExportsShadowed: true,
      isModuleShadowed: false,
      title: 'exports.foo when exports shadowed',
    },
    {
      code: 'module.exports = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: true,
      title: 'module.exports when module shadowed',
    },
    {
      code: 'module.foo = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.foo non-export property',
    },
    {
      code: 'module.foo.exports = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.foo.exports indirect export',
    },
    {
      code: 'other.module.exports = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'other.module.exports non-root module',
    },
    {
      code: 'other.exports.foo = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'other.exports.foo non-root exports',
    },
    {
      code: 'exports = 1;',
      expected: false,
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'exports identifier assignment',
    },
  ])(
    'evaluates $title as $expected',
    ({ code, expected, isExportsShadowed, isModuleShadowed }) => {
      const left = parseLeft(code);
      expect(
        isCommonJsExportAssignment(left, isModuleShadowed, isExportsShadowed)
      ).toBe(expected);
    }
  );

  it('returns false for non-member-expression node', () => {
    const node: TAstNode = { name: 'foo', type: 'Identifier' };
    expect(isCommonJsExportAssignment(node, false, false)).toBe(false);
  });

  it('returns false when member object is not an AST node', () => {
    const node: TAstNode = {
      object: 'invalid',
      type: 'MemberExpression',
    };
    expect(isCommonJsExportAssignment(node, false, false)).toBe(false);
  });

  it('returns false when member object is null', () => {
    const node: TAstNode = {
      computed: false,
      object: null,
      property: { name: 'foo', type: 'Identifier' },
      type: 'MemberExpression',
    };
    expect(isCommonJsExportAssignment(node, false, false)).toBe(false);
  });

  it('returns false when member object has exports name but is not identifier', () => {
    const node: TAstNode = {
      computed: false,
      object: { name: 'exports', type: 'Other' },
      property: { name: 'foo', type: 'Identifier' },
      type: 'MemberExpression',
    };
    expect(isCommonJsExportAssignment(node, false, false)).toBe(false);
  });

  it('returns false when property is not an AST node', () => {
    const node: TAstNode = {
      computed: false,
      object: { name: 'module', type: 'Identifier' },
      property: 'invalid',
      type: 'MemberExpression',
    };
    expect(isCommonJsExportAssignment(node, false, false)).toBe(false);
  });
});
