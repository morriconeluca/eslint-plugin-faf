import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleImport } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleImportExpression } from './handle-import-expression.util.js';

const parseAndHandleImportExpression = (code: string): TModuleImport[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement?.type === 'ExpressionStatement', 'Expected expr');
  assertInvariant(
    statement.expression.type === 'ImportExpression',
    'Expected import()'
  );
  const locator = createSourceLocator(code);
  const inlineImports: TModuleImport[] = [];
  const node: TAstNode = {
    ...statement.expression,
    type: statement.expression.type,
  };
  handleImportExpression(node, locator, inlineImports);
  return inlineImports;
};

describe('handleImportExpression', () => {
  it('extracts literal string dynamic import', () => {
    const inlineImports = parseAndHandleImportExpression(
      "import('./dynamic.js');"
    );
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'literal-dynamic-import',
        position: { column: 1, line: 1 },
        specifier: './dynamic.js',
      },
    ]);
  });

  it('extracts template literal dynamic import without expressions', () => {
    const inlineImports = parseAndHandleImportExpression(
      'import(`./dynamic.js`);'
    );
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'literal-dynamic-import',
        position: { column: 1, line: 1 },
        specifier: './dynamic.js',
      },
    ]);
  });

  it('extracts non-literal dynamic import for expression source', () => {
    const inlineImports = parseAndHandleImportExpression(
      'import(computePath());'
    );
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'non-literal-dynamic-import',
        position: { column: 1, line: 1 },
        specifier: null,
      },
    ]);
  });

  it('treats a non-node source as a non-literal dynamic import', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const node: TAstNode = {
      source: null,
      type: 'ImportExpression',
    };
    handleImportExpression(node, locator, inlineImports);
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'non-literal-dynamic-import',
        position: { column: 1, line: 1 },
        specifier: null,
      },
    ]);
  });

  it('falls back to position 0 when start offset is missing', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const node: TAstNode = {
      source: { type: 'Literal', value: './dynamic.js' },
      type: 'ImportExpression',
    };
    handleImportExpression(node, locator, inlineImports);
    expect(inlineImports[0]?.position).toEqual({ column: 1, line: 1 });
  });
});
