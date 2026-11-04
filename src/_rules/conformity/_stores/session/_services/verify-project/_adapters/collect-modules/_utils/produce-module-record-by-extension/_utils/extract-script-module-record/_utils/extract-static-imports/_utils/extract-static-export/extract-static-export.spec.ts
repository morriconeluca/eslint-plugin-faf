import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractStaticExport } from './index.js';

const parseAndExtractStaticExport = (code: string) => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ExportAllDeclaration' ||
      statement?.type === 'ExportNamedDeclaration',
    'Expected ExportAllDeclaration or ExportNamedDeclaration'
  );
  const locator = createSourceLocator(code);
  return extractStaticExport(statement, locator);
};

describe('extractStaticExport', () => {
  it('extracts export all from declaration', () => {
    const result = parseAndExtractStaticExport("export * from './all.js';");
    expect(result).toEqual({
      isTypeOnly: false,
      kind: 'export-all-from',
      position: { column: 1, line: 1 },
      specifier: './all.js',
    });
  });

  it('extracts export type all from declaration', () => {
    const result = parseAndExtractStaticExport(
      "export type * from './all.js';"
    );
    expect(result).toEqual({
      isTypeOnly: true,
      kind: 'export-type-from',
      position: { column: 1, line: 1 },
      specifier: './all.js',
    });
  });

  it('extracts export named from with value bindings', () => {
    const result = parseAndExtractStaticExport(
      "export { a, b } from './named.js';"
    );
    expect(result).toEqual({
      isTypeOnly: false,
      kind: 'export-named-from',
      position: { column: 1, line: 1 },
      specifier: './named.js',
    });
  });

  it('extracts export named from with exportKind type', () => {
    const result = parseAndExtractStaticExport(
      "export type { a } from './named.js';"
    );
    expect(result).toEqual({
      isTypeOnly: true,
      kind: 'export-type-from',
      position: { column: 1, line: 1 },
      specifier: './named.js',
    });
  });

  it('extracts export named from where all specifiers are type', () => {
    const result = parseAndExtractStaticExport(
      "export { type a, type b } from './named.js';"
    );
    expect(result).toEqual({
      isTypeOnly: true,
      kind: 'export-type-from',
      position: { column: 1, line: 1 },
      specifier: './named.js',
    });
  });

  it('extracts export named from with mixed specifiers as value import', () => {
    const result = parseAndExtractStaticExport(
      "export { type a, b } from './named.js';"
    );
    expect(result).toEqual({
      isTypeOnly: false,
      kind: 'export-named-from',
      position: { column: 1, line: 1 },
      specifier: './named.js',
    });
  });

  it('extracts export named from with empty specifiers', () => {
    const result = parseAndExtractStaticExport("export {} from './empty.js';");
    expect(result).toEqual({
      isTypeOnly: false,
      kind: 'export-named-from',
      position: { column: 1, line: 1 },
      specifier: './empty.js',
    });
  });

  it('returns null when export named has no source', () => {
    const result = parseAndExtractStaticExport('export { localOnly };');
    expect(result).toBeNull();
  });
});
