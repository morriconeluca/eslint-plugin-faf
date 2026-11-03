import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { collectTypeSymbols } from './index.js';

describe('collectTypeSymbols', () => {
  it('collects interface symbol with type space', () => {
    const code = 'interface User { id: string; }';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'TSInterfaceDeclaration',
      'Expected interface'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectTypeSymbols(statement, locator, symbols);

    expect(symbols).toEqual([
      { name: 'User', position: { column: 11, line: 1 }, space: 'type' },
    ]);
  });

  it('collects type alias symbol with type space', () => {
    const code = 'type ID = number;';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'TSTypeAliasDeclaration',
      'Expected type alias'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectTypeSymbols(statement, locator, symbols);

    expect(symbols).toEqual([
      { name: 'ID', position: { column: 6, line: 1 }, space: 'type' },
    ]);
  });
});
