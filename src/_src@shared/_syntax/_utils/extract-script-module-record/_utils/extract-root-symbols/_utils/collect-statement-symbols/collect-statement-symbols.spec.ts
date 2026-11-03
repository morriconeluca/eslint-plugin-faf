import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { collectStatementSymbols } from './index.js';

const parseAndCollectStatement = (
  code: string,
  initialSeenFunctions: readonly string[] = []
): TRootSymbol[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(statement !== undefined, 'Expected statement');
  const locator = createSourceLocator(code);
  const symbols: TRootSymbol[] = [];
  const seenFunctions = new Set<string>(initialSeenFunctions);
  collectStatementSymbols(statement, locator, symbols, seenFunctions);
  return symbols;
};

describe('collectStatementSymbols', () => {
  it('collects variable declaration symbols', () => {
    const symbols = parseAndCollectStatement('const a = 1, b = 2;');
    expect(symbols).toHaveLength(2);
    expect(symbols[0]?.name).toBe('a');
    expect(symbols[1]?.name).toBe('b');
  });

  it('collects named function declaration symbol', () => {
    const symbols = parseAndCollectStatement('function testFn() {}');
    expect(symbols).toEqual([
      { name: 'testFn', position: { column: 10, line: 1 }, space: 'value' },
    ]);
  });

  it('skips duplicate function declaration when already seen', () => {
    const symbols = parseAndCollectStatement('function testFn() {}', [
      'testFn',
    ]);
    expect(symbols).toHaveLength(0);
  });

  it('collects anonymous function declaration as default', () => {
    const result = parseSync('test.ts', 'export default function() {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportDefaultDeclaration',
      'Expected default export'
    );
    assertInvariant(
      statement.declaration.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator('export default function() {}');
    const symbols: TRootSymbol[] = [];
    collectStatementSymbols(statement.declaration, locator, symbols, new Set());
    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });

  it('collects named class declaration symbol', () => {
    const symbols = parseAndCollectStatement('class MyClass {}');
    expect(symbols).toEqual([
      { name: 'MyClass', position: { column: 7, line: 1 }, space: 'value' },
    ]);
  });

  it('collects anonymous class declaration as default', () => {
    const result = parseSync('test.ts', 'export default class {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportDefaultDeclaration',
      'Expected default export'
    );
    assertInvariant(
      statement.declaration.type === 'ClassDeclaration',
      'Expected class'
    );
    const locator = createSourceLocator('export default class {}');
    const symbols: TRootSymbol[] = [];
    collectStatementSymbols(statement.declaration, locator, symbols, new Set());
    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });

  it('collects enum declaration symbol', () => {
    const symbols = parseAndCollectStatement('enum Color { Red }');
    expect(symbols).toEqual([
      { name: 'Color', position: { column: 6, line: 1 }, space: 'value' },
    ]);
  });

  it('collects interface declaration symbol with type space', () => {
    const symbols = parseAndCollectStatement(
      'interface User { name: string; }'
    );
    expect(symbols).toEqual([
      { name: 'User', position: { column: 11, line: 1 }, space: 'type' },
    ]);
  });

  it('collects type alias declaration symbol with type space', () => {
    const symbols = parseAndCollectStatement('type ID = string;');
    expect(symbols).toEqual([
      { name: 'ID', position: { column: 6, line: 1 }, space: 'type' },
    ]);
  });

  it('collects namespace declaration with value space when it has value members', () => {
    const symbols = parseAndCollectStatement(
      'namespace Models { export const x = 1; }'
    );
    expect(symbols).toEqual([
      { name: 'Models', position: { column: 11, line: 1 }, space: 'value' },
    ]);
  });

  it('collects namespace declaration with type space when it has only types', () => {
    const symbols = parseAndCollectStatement(
      'namespace Models { export type T = string; }'
    );
    expect(symbols).toEqual([
      { name: 'Models', position: { column: 11, line: 1 }, space: 'type' },
    ]);
  });

  it('ignores other statement types like expressions', () => {
    const symbols = parseAndCollectStatement('console.log(123);');
    expect(symbols).toHaveLength(0);
  });
});
