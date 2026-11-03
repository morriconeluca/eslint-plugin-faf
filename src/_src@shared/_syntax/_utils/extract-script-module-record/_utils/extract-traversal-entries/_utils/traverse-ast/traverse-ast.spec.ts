import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../_types/module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { createSourceLocator } from '../../../create-source-locator/index.js';
import { traverseAst } from './index.js';

const parseAndTraverse = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(code);
  const inlineImports: TModuleImport[] = [];
  const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
  const rootNode: TAstNode = { ...result.program, type: result.program.type };
  traverseAst(rootNode, false, locator, inlineImports, unsupportedSyntaxes);
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
});
