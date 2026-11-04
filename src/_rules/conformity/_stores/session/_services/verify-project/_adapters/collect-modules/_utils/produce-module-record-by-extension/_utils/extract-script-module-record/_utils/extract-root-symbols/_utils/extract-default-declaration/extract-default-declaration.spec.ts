import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractDefaultDeclaration } from './index.js';

const parseAndExtractDefault = (
  code: string,
  initialSymbols: TRootSymbol[] = [],
  importedNames: readonly string[] = []
): TRootSymbol[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ExportDefaultDeclaration',
    'Expected ExportDefaultDeclaration'
  );
  const locator = createSourceLocator(code);
  const symbols = [...initialSymbols];
  const seenFunctions = new Set<string>();
  extractDefaultDeclaration(
    statement,
    locator,
    symbols,
    seenFunctions,
    new Set(importedNames)
  );
  return symbols;
};

describe('extractDefaultDeclaration', () => {
  it('extracts named class default export', () => {
    const symbols = parseAndExtractDefault('export default class MyClass {}');
    expect(symbols).toEqual([
      { name: 'MyClass', position: { column: 1, line: 1 }, space: 'value' },
    ]);
  });

  it('extracts anonymous class default export', () => {
    const symbols = parseAndExtractDefault('export default class {}');
    expect(symbols).toEqual([
      { name: 'default', position: { column: 1, line: 1 }, space: 'value' },
    ]);
  });

  it('extracts named function default export', () => {
    const result = parseSync('test.ts', 'export default function myFunc() {}', {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportDefaultDeclaration',
      'Expected ExportDefaultDeclaration'
    );
    const locator = createSourceLocator('export default function myFunc() {}');
    const symbols: TRootSymbol[] = [];
    const seenFunctions = new Set<string>();
    extractDefaultDeclaration(
      statement,
      locator,
      symbols,
      seenFunctions,
      new Set()
    );

    expect(symbols).toEqual([
      { name: 'myFunc', position: { column: 25, line: 1 }, space: 'value' },
    ]);
    expect(seenFunctions.has('myFunc')).toBe(true);
  });

  it('extracts anonymous function default export', () => {
    const symbols = parseAndExtractDefault('export default function() {}');
    expect(symbols).toEqual([
      { name: 'default', position: { column: 1, line: 1 }, space: 'value' },
    ]);
  });

  it('skips duplicate seen function implementation', () => {
    const result = parseSync(
      'test.ts',
      'export default function overloaded() {}',
      {
        lang: 'ts',
        sourceType: 'module',
      }
    );
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportDefaultDeclaration',
      'Expected ExportDefaultDeclaration'
    );
    const locator = createSourceLocator(
      'export default function overloaded() {}'
    );
    const symbols: TRootSymbol[] = [];
    const seenFunctions = new Set<string>(['overloaded']);
    extractDefaultDeclaration(
      statement,
      locator,
      symbols,
      seenFunctions,
      new Set()
    );
    expect(symbols).toHaveLength(0);
  });

  it('does not push duplicate symbol when identifier is already in symbols', () => {
    const existing: TRootSymbol[] = [
      { name: 'localFoo', position: { column: 7, line: 1 }, space: 'value' },
    ];
    const symbols = parseAndExtractDefault(
      'export default localFoo;',
      existing
    );
    expect(symbols).toEqual(existing);
  });

  it('does not push duplicate symbol when identifier is in importedNames', () => {
    const symbols = parseAndExtractDefault(
      'export default importedBar;',
      [],
      ['importedBar']
    );
    expect(symbols).toHaveLength(0);
  });

  it('pushes default symbol when identifier is unknown', () => {
    const symbols = parseAndExtractDefault('export default unknownIdent;');
    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });

  it('pushes default symbol for expressions', () => {
    const symbols = parseAndExtractDefault('export default 42;');
    expect(symbols).toEqual([
      { name: 'default', position: { column: 16, line: 1 }, space: 'value' },
    ]);
  });
});
