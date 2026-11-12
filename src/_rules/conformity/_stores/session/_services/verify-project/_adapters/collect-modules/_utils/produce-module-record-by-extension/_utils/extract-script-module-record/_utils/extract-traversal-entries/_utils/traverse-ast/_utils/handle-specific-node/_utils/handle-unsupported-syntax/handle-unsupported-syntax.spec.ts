import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TUnsupportedSyntax } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleUnsupportedSyntax } from './handle-unsupported-syntax.util.js';

const parseAssignmentNode = (code: string): TAstNode => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement?.type === 'ExpressionStatement', 'Expected expr');
  assertInvariant(
    statement.expression.type === 'AssignmentExpression',
    'Expected assign'
  );
  return { ...statement.expression, type: statement.expression.type };
};

describe('handleUnsupportedSyntax', () => {
  it('reports unsupported syntax for TSExportAssignment with start offset', () => {
    const code = 'export = legacy;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      start: 5,
      type: 'TSExportAssignment',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description: 'TypeScript export assignment (export =) is unsupported',
        position: { column: 6, line: 1 },
      },
    ]);
  });

  it('reports unsupported syntax for TSExportAssignment when start is missing', () => {
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      type: 'TSExportAssignment',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description: 'TypeScript export assignment (export =) is unsupported',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it('reports unsupported syntax for module.exports assignment with non-zero start offset', () => {
    const code = '   module.exports = 1;';
    const node = parseAssignmentNode(code);
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description:
          'CommonJS export assignment (module.exports / exports) is unsupported',
        position: { column: 4, line: 1 },
      },
    ]);
  });

  it('does not report for binary expression with module.exports left operand', () => {
    const code = 'module.exports === 1;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'ExpressionStatement', 'Expected expr');
    const node: TAstNode = {
      ...statement.expression,
      type: statement.expression.type,
    };
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });

  it('reports unsupported syntax for module.exports assignment when start is missing', () => {
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      left: {
        computed: false,
        object: { name: 'module', type: 'Identifier' },
        property: { name: 'exports', type: 'Identifier' },
        type: 'MemberExpression',
      },
      type: 'AssignmentExpression',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description:
          'CommonJS export assignment (module.exports / exports) is unsupported',
        position: { column: 1, line: 1 },
      },
    ]);
  });

  it.each([
    {
      code: 'module.exports = { a: 1 };',
      column: 1,
      title: 'module.exports',
    },
    {
      code: 'module["exports"] = 1;',
      column: 1,
      title: 'module["exports"] computed',
    },
    {
      code: 'module.exports.foo = 1;',
      column: 1,
      title: 'module.exports.foo deep',
    },
    {
      code: 'module["exports"].foo = 1;',
      column: 1,
      title: 'module["exports"].foo computed deep',
    },
    {
      code: 'exports.foo = 1;',
      column: 1,
      title: 'exports.foo',
    },
    {
      code: 'exports["foo"] = 1;',
      column: 1,
      title: 'exports["foo"] computed',
    },
    {
      code: 'exports.foo.bar = 1;',
      column: 1,
      title: 'exports.foo.bar deep',
    },
  ])('reports unsupported syntax for $title assignment', ({ code, column }) => {
    const node = parseAssignmentNode(code);
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toEqual([
      {
        description:
          'CommonJS export assignment (module.exports / exports) is unsupported',
        position: { column, line: 1 },
      },
    ]);
  });

  it.each([
    {
      code: 'module.exports = 1;',
      isExportsShadowed: false,
      isModuleShadowed: true,
      title: 'module.exports when module shadowed',
    },
    {
      code: 'exports.foo = 1;',
      isExportsShadowed: true,
      isModuleShadowed: false,
      title: 'exports.foo when exports shadowed',
    },
    {
      code: 'module.foo = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.foo non-export property',
    },
    {
      code: 'module.foo.exports = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'module.foo.exports indirect export',
    },
    {
      code: 'module[variable] = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'dynamic module[variable]',
    },
    {
      code: 'other.module.exports = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'other.module.exports non-root module',
    },
    {
      code: 'other.exports.foo = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'other.exports.foo non-root exports',
    },
    {
      code: 'exports = 1;',
      isExportsShadowed: false,
      isModuleShadowed: false,
      title: 'exports identifier assignment',
    },
  ])(
    'does not report for $title',
    ({ code, isExportsShadowed, isModuleShadowed }) => {
      const node = parseAssignmentNode(code);
      const locator = createSourceLocator(code);
      const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

      handleUnsupportedSyntax(
        node,
        isModuleShadowed,
        isExportsShadowed,
        locator,
        unsupportedSyntaxes
      );

      expect(unsupportedSyntaxes).toHaveLength(0);
    }
  );

  it('does not report for assignment with invalid member object', () => {
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      left: {
        object: 'invalid',
        type: 'MemberExpression',
      },
      type: 'AssignmentExpression',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });

  it('does not report for assignment with invalid member property', () => {
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      left: {
        computed: false,
        object: { name: 'module', type: 'Identifier' },
        property: 'invalid',
        type: 'MemberExpression',
      },
      type: 'AssignmentExpression',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });

  it('does not report unsupported syntax for ambient module declaration', () => {
    const code = 'declare module "ambient" {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      kind: 'module',
      start: 0,
      type: 'TSModuleDeclaration',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });

  it('does not report unsupported syntax for global augmentation', () => {
    const code = 'declare global {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    const locator = createSourceLocator(code);
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      ...statement,
      kind: 'global',
      start: 0,
      type: 'TSModuleDeclaration',
    };

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });

  it('ignores other supported node types', () => {
    const node: TAstNode = { type: 'VariableDeclaration' };
    const locator = createSourceLocator('');
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

    handleUnsupportedSyntax(node, false, false, locator, unsupportedSyntaxes);

    expect(unsupportedSyntaxes).toHaveLength(0);
  });
});
