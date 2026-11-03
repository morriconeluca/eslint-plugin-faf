import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { extractReExportSpecifiers } from './index.js';

describe('extractReExportSpecifiers', () => {
  it('extracts re-export specifiers from external source', () => {
    const code = "export { orig as renamed } from './dep.js';";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];

    extractReExportSpecifiers(statement, locator, exports);

    expect(exports).toEqual([
      {
        exportedName: 'renamed',
        isTypeOnly: false,
        origin: {
          importedName: 'orig',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 1 },
      },
    ]);
  });

  it('marks re-export specifiers as type-only when declaration has type kind', () => {
    const code = "export type { orig } from './dep.js';";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];

    extractReExportSpecifiers(statement, locator, exports);

    expect(exports[0]?.isTypeOnly).toBe(true);
  });

  it('does nothing when statement source is null', () => {
    const code = 'export { localOnly };';
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'ExportNamedDeclaration',
      'Expected export'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];

    extractReExportSpecifiers(statement, locator, exports);

    expect(exports).toHaveLength(0);
  });
});
