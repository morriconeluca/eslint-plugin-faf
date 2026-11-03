import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { collectClassOrEnumSymbols } from './index.js';

describe('collectClassOrEnumSymbols', () => {
  it('collects named class declaration symbol', () => {
    const code = 'class MyClass {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'ClassDeclaration', 'Expected class');
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectClassOrEnumSymbols(statement, locator, symbols);

    expect(symbols).toEqual([
      { name: 'MyClass', position: { column: 7, line: 1 }, space: 'value' },
    ]);
  });

  it('collects anonymous class declaration as default', () => {
    const code = 'export default class {}';
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
      statement.declaration.type === 'ClassDeclaration',
      'Expected class'
    );
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectClassOrEnumSymbols(statement.declaration, locator, symbols);

    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });

  it('collects enum declaration symbol', () => {
    const code = 'enum Color { Red }';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(statement?.type === 'TSEnumDeclaration', 'Expected enum');
    const locator = createSourceLocator(code);
    const symbols: TRootSymbol[] = [];

    collectClassOrEnumSymbols(statement, locator, symbols);

    expect(symbols).toEqual([
      { name: 'Color', position: { column: 6, line: 1 }, space: 'value' },
    ]);
  });
});
