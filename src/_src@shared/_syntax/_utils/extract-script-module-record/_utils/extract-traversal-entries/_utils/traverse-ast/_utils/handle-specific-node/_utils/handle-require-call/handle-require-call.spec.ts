import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_types/module-record.type.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleRequireCall } from './index.js';

const parseAndHandleRequire = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement?.type === 'ExpressionStatement', 'Expected expr');
  assertInvariant(
    statement.expression.type === 'CallExpression',
    'Expected call'
  );
  const locator = createSourceLocator(code);
  const inlineImports: TModuleImport[] = [];
  const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
  const node: TAstNode = {
    ...statement.expression,
    type: statement.expression.type,
  };
  handleRequireCall(node, locator, inlineImports, unsupportedSyntaxes);
  return { inlineImports, unsupportedSyntaxes };
};

describe('handleRequireCall', () => {
  it('extracts literal string require call', () => {
    const { inlineImports, unsupportedSyntaxes } = parseAndHandleRequire(
      "require('./module.js');"
    );
    expect(unsupportedSyntaxes).toHaveLength(0);
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'require-call',
        position: { column: 1, line: 1 },
        specifier: './module.js',
      },
    ]);
  });

  it('extracts template literal require call without expressions', () => {
    const { inlineImports, unsupportedSyntaxes } = parseAndHandleRequire(
      'require(`./module.js`);'
    );
    expect(unsupportedSyntaxes).toHaveLength(0);
    expect(inlineImports).toEqual([
      {
        isTypeOnly: false,
        kind: 'require-call',
        position: { column: 1, line: 1 },
        specifier: './module.js',
      },
    ]);
  });

  it('falls back to position 0 when start offset is missing', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const unsupportedSyntaxes: TUnsupportedSyntax[] = [];
    const node: TAstNode = {
      arguments: [{ type: 'Literal', value: './dep.js' }],
      type: 'CallExpression',
    };
    handleRequireCall(node, locator, inlineImports, unsupportedSyntaxes);
    expect(inlineImports[0]?.position).toEqual({ column: 1, line: 1 });
  });

  it.each([
    { code: 'require();', title: 'zero arguments' },
    { code: "require('a', 'b');", title: 'multiple arguments' },
    { code: 'require(variableName);', title: 'dynamic variable argument' },
    {
      code: 'require(`prefix/${dynamic}`);',
      title: 'template with expressions',
    },
  ])('reports unsupported syntax for $title', ({ code }) => {
    const { inlineImports, unsupportedSyntaxes } = parseAndHandleRequire(code);
    expect(inlineImports).toHaveLength(0);
    expect(unsupportedSyntaxes).toHaveLength(1);
    expect(unsupportedSyntaxes[0]?.description).toBe(
      'Unsupported non-literal require call'
    );
  });
});
