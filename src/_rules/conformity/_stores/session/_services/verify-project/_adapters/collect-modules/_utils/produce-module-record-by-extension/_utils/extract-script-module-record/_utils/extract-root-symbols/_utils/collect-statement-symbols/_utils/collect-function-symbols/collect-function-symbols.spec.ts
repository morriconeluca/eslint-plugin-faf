import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { collectFunctionSymbols } from './index.js';

describe('collectFunctionSymbols', () => {
  it('collects named function declaration symbol', () => {
    const code = 'function named() {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];
    const seenFunctions = new Set<string>();

    collectFunctionSymbols(statement, locator, symbols, seenFunctions);

    expect(symbols).toEqual([
      { name: 'named', position: { column: 10, line: 1 }, space: 'value' },
    ]);
    expect(seenFunctions.has('named')).toBe(true);
  });

  it('skips duplicate function when already seen in overloads', () => {
    const code = 'function overloaded() {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];
    const seenFunctions = new Set<string>(['overloaded']);

    collectFunctionSymbols(statement, locator, symbols, seenFunctions);

    expect(symbols).toHaveLength(0);
  });

  it('collects anonymous function as default symbol', () => {
    const code = 'export default function() {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportDefaultDeclaration',
      'Expected default'
    );
    assertInvariant(
      statement.declaration.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];
    const seenFunctions = new Set<string>();

    collectFunctionSymbols(
      statement.declaration,
      locator,
      symbols,
      seenFunctions
    );

    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });
});
