import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TAstNode } from '../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { traverseAst } from './traverse-ast.util.js';

const parseAndTraverse = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(code);
  const inlineImports: TModuleImport[] = [];
  const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
  const rootNode: TAstNode = { ...result.program, type: result.program.type };
  traverseAst(
    rootNode,
    false,
    false,
    false,
    locator,
    inlineImports,
    unsupportedSyntaxes
  );
  return { inlineImports, unsupportedSyntaxes };
};

describe('traverseAst', () => {
  it('discovers require call within nested function', () => {
    const code = "function fn() { const x = require('./nested.js'); }";
    const { inlineImports } = parseAndTraverse(code);
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'require-call',
        position: { column: 27, line: 1 },
        specifier: './nested.js',
      },
    ]);
  });

  it('skips require call when require is shadowed locally', () => {
    const code =
      "function fn(require: unknown) { const x = require('./nested.js'); }";
    const { inlineImports } = parseAndTraverse(code);
    expect(inlineImports).toHaveLength(0);
  });

  it('discovers dynamic import within expression', () => {
    const code = "const load = () => import('./async.js');";
    const { inlineImports } = parseAndTraverse(code);
    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('literal-dynamic-import');
  });

  it('discovers ts import type', () => {
    const code = "type T = import('./types.js').MyType;";
    const { inlineImports } = parseAndTraverse(code);
    expect(inlineImports).toHaveLength(1);
    expect(inlineImports[0]?.kind).toBe('typescript-import-type');
  });

  it('reports unsupported export = assignment', () => {
    const code = 'export = legacy;';
    const { unsupportedSyntaxes } = parseAndTraverse(code);
    expect(unsupportedSyntaxes).toHaveLength(1);
    expect(unsupportedSyntaxes[0]?.description).toContain('export =');
  });

  it.each([
    {
      code: 'module.exports = 1;',
      title: 'module.exports',
    },
    {
      code: 'module.exports.foo = 1;',
      title: 'module.exports.foo',
    },
    {
      code: 'exports.x = 1;',
      title: 'exports.x',
    },
  ])('reports unsupported syntax for $title assignment', ({ code }) => {
    const { unsupportedSyntaxes } = parseAndTraverse(code);
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
      code: 'function fn(exports: unknown) { exports.x = 1; }',
      title: 'exports variable is shadowed in parameter',
    },
    {
      code: 'function fn(module: unknown) { module.exports = 1; }',
      title: 'module variable is shadowed in parameter',
    },
    {
      code: '{ const exports = { x: 0 }; exports.x = 1; }',
      title: 'exports variable is shadowed in local scope',
    },
    {
      code: '{ const module = { exports: 0 }; module.exports = 1; }',
      title: 'module variable is shadowed in local scope',
    },
    {
      code: 'exports.push(1);',
      title: 'non-assignment call like exports.push',
    },
  ])('does not report when $title', ({ code }) => {
    const { unsupportedSyntaxes } = parseAndTraverse(code);
    expect(unsupportedSyntaxes).toHaveLength(0);
  });
});
