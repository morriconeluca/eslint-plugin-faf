import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractFunctionExports } from './index.js';

describe('extractFunctionExports', () => {
  it('extracts named function export', () => {
    const code = 'export function myFunc() {}';
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
      statement.declaration?.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractFunctionExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'myFunc',
        isTypeOnly: false,
        origin: { symbolName: 'myFunc', type: 'local-symbol' },
        position: { column: 8, line: 1 },
      },
    ]);
  });

  it('extracts anonymous function with default name', () => {
    const code = 'export default function() {}';
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
      statement.declaration.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractFunctionExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'default',
        isTypeOnly: false,
        origin: { symbolName: 'default', type: 'local-symbol' },
        position: { column: 16, line: 1 },
      },
    ]);
  });

  it('skips duplicate function export if name is in seenExportNames', () => {
    const code = 'export function myFunc() {}';
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
      statement.declaration?.type === 'FunctionDeclaration',
      'Expected function'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>(['myFunc']);

    extractFunctionExports(statement.declaration, locator, exports, seen);

    expect(exports).toHaveLength(0);
  });
});
