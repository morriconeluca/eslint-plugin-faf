import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleImport } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { handleTsImportType } from './handle-ts-import-type.util.js';

describe('handleTsImportType', () => {
  it('extracts typescript import type expression', () => {
    const code = "type MyType = import('./types.js').ExportedType;";
    const result = parseSync('test.ts', code, {
      lang: 'ts',
      sourceType: 'module',
    });
    const statement = result.program.body[0];
    assertInvariant(
      statement?.type === 'TSTypeAliasDeclaration',
      'Expected type alias'
    );
    assertInvariant(
      statement.typeAnnotation.type === 'TSImportType',
      'Expected TSImportType'
    );
    const locator = createSourceLocator(code);
    const inlineImports: TModuleImport[] = [];
    const node: TAstNode = {
      ...statement.typeAnnotation,
      type: statement.typeAnnotation.type,
    };

    handleTsImportType(node, locator, inlineImports);

    expect(inlineImports).toEqual([
      {
        isTypeOnly: true,
        kind: 'typescript-import-type',
        position: { column: 15, line: 1 },
        specifier: './types.js',
      },
    ]);
  });

  it('falls back to position 0 and empty specifier when attributes are missing', () => {
    const locator = createSourceLocator('');
    const inlineImports: TModuleImport[] = [];
    const node: TAstNode = {
      type: 'TSImportType',
    };

    handleTsImportType(node, locator, inlineImports);

    expect(inlineImports[0]?.position).toEqual({ column: 1, line: 1 });
    expect(inlineImports[0]?.specifier).toBe('');
  });
});
