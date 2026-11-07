import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractDeclarationExports } from './extract-declaration-exports.util.js';

const parseAndExtractExports = (code: string): TModuleExport[] => {
  const result = parseSync('test.ts', code, {
    lang: 'ts',
    sourceType: 'module',
  });
  const statement = result.program.body[0];
  assertInvariant(
    statement?.type === 'ExportNamedDeclaration',
    'Expected export'
  );
  assertInvariant(statement.declaration !== null, 'Expected declaration');
  const locator = createSourceLocator(code);
  const exports: TModuleExport[] = [];
  const seenExportNames = new Set<string>();
  extractDeclarationExports(
    statement.declaration,
    locator,
    exports,
    seenExportNames
  );
  return exports;
};

describe('extractDeclarationExports', () => {
  it('extracts exported variable declarations', () => {
    const exports = parseAndExtractExports('export const x = 1, y = 2;');
    expect(exports).toHaveLength(2);
    expect(exports[0]?.exportedName).toBe('x');
    expect(exports[1]?.exportedName).toBe('y');
  });

  it('extracts exported function declaration', () => {
    const exports = parseAndExtractExports('export function myFn() {}');
    expect(exports).toEqual([
      {
        exportedName: 'myFn',
        isTypeOnly: false,
        origin: { symbolName: 'myFn', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
  });

  it('skips duplicate function overload exports', () => {
    const code = 'export function myFn(): void; export function myFn() {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seenExportNames = new Set<string>();

    for (const statement of result.program.body) {
      if (
        statement.type === 'ExportNamedDeclaration' &&
        statement.declaration !== null
      ) {
        extractDeclarationExports(
          statement.declaration,
          locator,
          exports,
          seenExportNames
        );
      }
    }

    expect(exports).toHaveLength(1);
  });

  it('extracts exported class declaration', () => {
    const exports = parseAndExtractExports('export class MyClass {}');
    expect(exports).toEqual([
      {
        exportedName: 'MyClass',
        isTypeOnly: false,
        origin: { symbolName: 'MyClass', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
  });

  it('extracts exported enum declaration', () => {
    const exports = parseAndExtractExports('export enum Color { Red }');
    expect(exports).toEqual([
      {
        exportedName: 'Color',
        isTypeOnly: false,
        origin: { symbolName: 'Color', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
  });

  it('extracts exported interface declaration with type flag', () => {
    const exports = parseAndExtractExports('export interface User {}');
    expect(exports).toEqual([
      {
        exportedName: 'User',
        isTypeOnly: true,
        origin: { symbolName: 'User', type: 'local-symbol' },
        position: { column: 18, line: 1 },
      },
    ]);
  });

  it('extracts exported type alias declaration with type flag', () => {
    const exports = parseAndExtractExports('export type ID = string;');
    expect(exports).toEqual([
      {
        exportedName: 'ID',
        isTypeOnly: true,
        origin: { symbolName: 'ID', type: 'local-symbol' },
        position: { column: 13, line: 1 },
      },
    ]);
  });

  it('extracts exported namespace declaration', () => {
    const exports = parseAndExtractExports('export namespace N {}');
    expect(exports).toEqual([
      {
        exportedName: 'N',
        isTypeOnly: false,
        origin: { symbolName: 'N', type: 'local-symbol' },
        position: { column: 18, line: 1 },
      },
    ]);
  });
});
