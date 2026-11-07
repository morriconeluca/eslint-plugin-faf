import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractVariableExports } from './extract-variable-exports.util.js';

describe('extractVariableExports', () => {
  it('extracts exported variable declarations with multiple declarators', () => {
    const code = 'export const first = 1, second = 2;';
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
      statement.declaration?.type === 'VariableDeclaration',
      'Expected var'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seenExportNames = new Set<string>();

    extractVariableExports(
      statement.declaration,
      locator,
      exports,
      seenExportNames
    );

    expect(exports).toHaveLength(2);
    expect(exports[0]?.exportedName).toBe('first');
    expect(exports[1]?.exportedName).toBe('second');
    expect(seenExportNames.has('first')).toBe(true);
    expect(seenExportNames.has('second')).toBe(true);
  });
});
