import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractClassExports } from './index.js';

describe('extractClassExports', () => {
  it('extracts exported class declaration', () => {
    const code = 'export class MyClass {}';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    assertInvariant(
      statement.declaration?.type === 'ClassDeclaration',
      'Expected class'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractClassExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'MyClass',
        isTypeOnly: false,
        origin: { symbolName: 'MyClass', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
    expect(seen.has('MyClass')).toBe(true);
  });

  it('extracts anonymous class with default name', () => {
    const code = 'export default class {}';
    const result = parseSync('test.ts', code, {
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
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractClassExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'default',
        isTypeOnly: false,
        origin: { symbolName: 'default', type: 'local-symbol' },
        position: { column: 16, line: 1 },
      },
    ]);
    expect(seen.has('default')).toBe(true);
  });

  it('extracts exported enum declaration', () => {
    const code = 'export enum Color { Red }';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    assertInvariant(
      statement.declaration?.type === 'TSEnumDeclaration',
      'Expected enum'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractClassExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'Color',
        isTypeOnly: false,
        origin: { symbolName: 'Color', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
    expect(seen.has('Color')).toBe(true);
  });
});
