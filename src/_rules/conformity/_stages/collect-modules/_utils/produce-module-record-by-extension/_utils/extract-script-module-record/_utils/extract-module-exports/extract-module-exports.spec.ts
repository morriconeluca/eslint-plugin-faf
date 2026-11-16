import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../../../../../_conformity@shared/_types/verification-model.type.js';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractModuleExports } from './extract-module-exports.util.js';

const parseAndExtractExports = (
  sourceText: string,
  symbols: readonly TRootSymbol[] = []
) => {
  const parseResult = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  return extractModuleExports(
    parseResult.program.body,
    symbols,
    new Map(),
    locator
  );
};

describe('extractModuleExports', () => {
  it.each([
    {
      code: "export * from './source';",
      expectedExportedName: '*',
      expectedOrigin: { specifier: './source', type: 'export-all' },
      isTypeOnly: false,
      title: 'export star re-export',
    },
    {
      code: "export * as source from './source';",
      expectedExportedName: 'source',
      expectedOrigin: { specifier: './source', type: 'namespace' },
      isTypeOnly: false,
      title: 'export star as identifier namespace',
    },
    {
      code: "export * as 'ns-alias' from './source';",
      expectedExportedName: 'ns-alias',
      expectedOrigin: { specifier: './source', type: 'namespace' },
      isTypeOnly: false,
      title: 'export star as literal namespace',
    },
    {
      code: "export type * from './source';",
      expectedExportedName: '*',
      expectedOrigin: { specifier: './source', type: 'export-all' },
      isTypeOnly: true,
      title: 'export type star re-export',
    },
  ])(
    'extracts export-all declaration for $title',
    ({ code, expectedExportedName, expectedOrigin, isTypeOnly }) => {
      const exports = parseAndExtractExports(code);
      expect(exports).toEqual([
        {
          exportedName: expectedExportedName,
          isTypeOnly,
          origin: expectedOrigin,
          position: { column: 1, line: 1 },
        },
      ]);
    }
  );

  it('dispatches declaration exports, specifier exports, and default exports in statement order', () => {
    const code = [
      'export const local = 1;',
      "export { dep as renamed } from './dep.js';",
      'export default function widget() {}',
    ].join('\n');
    const exports = parseAndExtractExports(code, [
      { name: 'local', position: { column: 14, line: 1 }, space: 'value' },
      { name: 'widget', position: { column: 25, line: 3 }, space: 'value' },
    ]);

    expect(exports).toEqual([
      {
        exportedName: 'local',
        isTypeOnly: false,
        origin: { symbolName: 'local', type: 'local-symbol' },
        position: { column: 14, line: 1 },
      },
      {
        exportedName: 'renamed',
        isTypeOnly: false,
        origin: {
          importedName: 'dep',
          specifier: './dep.js',
          type: 'imported-binding',
        },
        position: { column: 10, line: 2 },
      },
      {
        exportedName: 'default',
        isTypeOnly: false,
        origin: { symbolName: 'widget', type: 'local-symbol' },
        position: { column: 1, line: 3 },
      },
    ]);
  });

  it('ignores non-export statements', () => {
    expect(parseAndExtractExports('const privateOnly = 1;')).toEqual([]);
  });
});
