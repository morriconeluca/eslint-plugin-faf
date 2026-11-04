import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractTypeExports } from './index.js';

describe('extractTypeExports', () => {
  it('extracts exported interface declaration', () => {
    const code = 'export interface User { id: string; }';
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
      statement.declaration?.type === 'TSInterfaceDeclaration',
      'Expected interface'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractTypeExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'User',
        isTypeOnly: true,
        origin: { symbolName: 'User', type: 'local-symbol' },
        position: { column: 18, line: 1 },
      },
    ]);
    expect(seen.has('User')).toBe(true);
  });

  it('extracts exported type alias declaration', () => {
    const code = 'export type ID = number;';
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
      statement.declaration?.type === 'TSTypeAliasDeclaration',
      'Expected type alias'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractTypeExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'ID',
        isTypeOnly: true,
        origin: { symbolName: 'ID', type: 'local-symbol' },
        position: { column: 13, line: 1 },
      },
    ]);
    expect(seen.has('ID')).toBe(true);
  });
});
