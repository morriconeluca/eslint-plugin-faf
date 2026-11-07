import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractStaticImports } from './extract-static-imports.util.js';

const parseAndExtract = (sourceText: string) => {
  const result = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  return extractStaticImports(result.program.body, locator);
};

describe('extractStaticImports', () => {
  it('extracts import declarations and records bindings', () => {
    const code = "import defaultVal, { namedVal } from './dep.js';";
    const { bindingMap, staticImports } = parseAndExtract(code);

    expect(staticImports).toHaveLength(1);
    expect(staticImports[0]).toMatchObject({
      isTypeOnly: false,
      kind: 'named-import',
      specifier: './dep.js',
    });
    expect(bindingMap.get('defaultVal')).toMatchObject({
      importedName: 'default',
      localName: 'defaultVal',
      specifier: './dep.js',
    });
    expect(bindingMap.get('namedVal')).toMatchObject({
      importedName: 'namedVal',
      localName: 'namedVal',
      specifier: './dep.js',
    });
  });

  it('extracts TS import equals declarations with external module reference', () => {
    const code = "import legacy = require('./legacy.js');";
    const { bindingMap, staticImports } = parseAndExtract(code);

    expect(staticImports).toHaveLength(1);
    expect(staticImports[0]).toMatchObject({
      isTypeOnly: false,
      kind: 'typescript-require-import',
      specifier: './legacy.js',
    });
    expect(bindingMap.get('legacy')).toMatchObject({
      importedName: 'default',
      localName: 'legacy',
      specifier: './legacy.js',
    });
  });

  it('ignores TS import equals declaration with internal entity reference', () => {
    const code = 'import internal = MyNamespace.Entity;';
    const { bindingMap, staticImports } = parseAndExtract(code);

    expect(staticImports).toHaveLength(0);
    expect(bindingMap.size).toBe(0);
  });

  it.each([
    {
      code: "export { foo, bar } from './source.js';",
      expectedKind: 'export-named-from',
      isTypeOnly: false,
    },
    {
      code: "export type { foo } from './source.js';",
      expectedKind: 'export-type-from',
      isTypeOnly: true,
    },
    {
      code: "export { type foo, type bar } from './source.js';",
      expectedKind: 'export-type-from',
      isTypeOnly: true,
    },
    {
      code: "export * from './source.js';",
      expectedKind: 'export-all-from',
      isTypeOnly: false,
    },
    {
      code: "export type * from './source.js';",
      expectedKind: 'export-type-from',
      isTypeOnly: true,
    },
  ])(
    'extracts static export $code as $expectedKind',
    ({ code, expectedKind, isTypeOnly }) => {
      const { staticImports } = parseAndExtract(code);

      expect(staticImports).toHaveLength(1);
      expect(staticImports[0]).toMatchObject({
        isTypeOnly,
        kind: expectedKind,
        specifier: './source.js',
      });
    }
  );

  it('ignores export named without source', () => {
    const code = 'const x = 1; export { x };';
    const { staticImports } = parseAndExtract(code);

    expect(staticImports).toHaveLength(0);
  });

  it('ignores non-import/export statements', () => {
    const code = 'const answer = 42; console.log(answer);';
    const { bindingMap, staticImports } = parseAndExtract(code);

    expect(staticImports).toHaveLength(0);
    expect(bindingMap.size).toBe(0);
  });
});
