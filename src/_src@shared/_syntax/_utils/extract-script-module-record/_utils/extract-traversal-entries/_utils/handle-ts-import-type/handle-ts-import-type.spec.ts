import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TModuleImport } from '../../../../../../_types/module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { assertInvariant } from '../../../../../../../_domain/_utils/assert-invariant/index.js';
import { createSourceLocator } from '../../../create-source-locator/index.js';
import { handleTsImportType } from './index.js';

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
