import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleExport } from '../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';

import { assertInvariant } from '../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractNamespaceExports } from './index.js';

describe('extractNamespaceExports', () => {
  it('extracts exported namespace declaration', () => {
    const code = 'export namespace MyNamespace {}';
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
      statement.declaration?.type === 'TSModuleDeclaration',
      'Expected namespace'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractNamespaceExports(statement.declaration, locator, exports, seen);

    expect(exports).toEqual([
      {
        exportedName: 'MyNamespace',
        isTypeOnly: false,
        origin: { symbolName: 'MyNamespace', type: 'local-symbol' },
        position: { column: 18, line: 1 },
      },
    ]);
    expect(seen.has('MyNamespace')).toBe(true);
  });

  it('ignores non-namespace module declarations with string literal id', () => {
    const code = 'export module "ambient" {}';
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
      statement.declaration?.type === 'TSModuleDeclaration',
      'Expected module'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractNamespaceExports(statement.declaration, locator, exports, seen);

    expect(exports).toHaveLength(0);
    expect(seen.size).toBe(0);
  });

  it('ignores module declarations that have module kind instead of namespace', () => {
    const code = 'export module OtherModule {}';
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
      statement.declaration?.type === 'TSModuleDeclaration',
      'Expected module'
    );
    const locator = createSourceLocator(code);
    const exports: TModuleExport[] = [];
    const seen = new Set<string>();

    extractNamespaceExports(statement.declaration, locator, exports, seen);

    expect(exports).toHaveLength(0);
  });
});
