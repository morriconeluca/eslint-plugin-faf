import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';
import type { TImportedBinding } from '../../../../extract-script-module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { extractDefaultExport } from './index.js';

const parseAndExtractDefault = (
  code: string,
  rootSymbols: readonly TRootSymbol[] = [],
  importedBindings: ReadonlyMap<string, TImportedBinding> = new Map()
) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ExportDefaultDeclaration',
    'Expected default export'
  );
  const locator = createSourceLocator(code);
  return extractDefaultExport(
    statement,
    rootSymbols,
    importedBindings,
    locator
  );
};

describe('extractDefaultExport', () => {
  it('extracts class default export', () => {
    const exported = parseAndExtractDefault('export default class Foo {}');
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: false,
      origin: { symbolName: 'Foo', type: 'local-symbol' },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts function default export', () => {
    const exported = parseAndExtractDefault('export default function bar() {}');
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: false,
      origin: { symbolName: 'bar', type: 'local-symbol' },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts identifier default export when identifier is imported binding', () => {
    const bindings = new Map<string, TImportedBinding>([
      [
        'importedVal',
        {
          importedName: 'orig',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'importedVal',
          specifier: './dep.js',
        },
      ],
    ]);
    const exported = parseAndExtractDefault(
      'export default importedVal;',
      [],
      bindings
    );
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: false,
      origin: {
        importedName: 'orig',
        specifier: './dep.js',
        type: 'imported-binding',
      },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts identifier default export when identifier is imported namespace', () => {
    const bindings = new Map<string, TImportedBinding>([
      [
        'ns',
        {
          importedName: '*',
          isNamespace: true,
          isTypeOnly: true,
          localName: 'ns',
          specifier: './dep.js',
        },
      ],
    ]);
    const exported = parseAndExtractDefault('export default ns;', [], bindings);
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: true,
      origin: {
        specifier: './dep.js',
        type: 'namespace',
      },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts identifier default export when identifier is local type', () => {
    const symbols: TRootSymbol[] = [
      { name: 'MyType', position: { column: 6, line: 1 }, space: 'type' },
    ];
    const exported = parseAndExtractDefault('export default MyType;', symbols);
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: true,
      origin: { symbolName: 'MyType', type: 'local-symbol' },
      position: { column: 1, line: 1 },
    });
  });

  it('extracts literal expression default export', () => {
    const exported = parseAndExtractDefault('export default 123;');
    expect(exported).toEqual({
      exportedName: 'default',
      isTypeOnly: false,
      origin: { symbolName: 'default', type: 'local-symbol' },
      position: { column: 1, line: 1 },
    });
  });
});
