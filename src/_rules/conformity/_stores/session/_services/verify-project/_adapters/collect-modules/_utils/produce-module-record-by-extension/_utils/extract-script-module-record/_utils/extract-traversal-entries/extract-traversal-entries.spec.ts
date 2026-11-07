import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractTraversalEntries } from './extract-traversal-entries.util.js';

const parseAndExtractTraversal = (sourceText: string) => {
  const parseResult = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  return extractTraversalEntries(parseResult.program, locator);
};

describe('extractTraversalEntries', () => {
  describe('require loader calls and shadowing', () => {
    it('extracts unshadowed literal require call as require-call import', () => {
      const code = "const mod = require('./target');";
      const result = parseAndExtractTraversal(code);
      expect(result.inlineImports).toHaveLength(1);
      expect(result.inlineImports[0]?.kind).toBe('require-call');
      expect(result.inlineImports[0]?.specifier).toBe('./target');
      expect(result.inlineImports[0]?.isTypeOnly).toBe(false);
      expect(result.unsupportedSyntaxes).toHaveLength(0);
    });

    it.each([
      {
        code: "const arrowExpr = (x: any) => require('./target');",
        title: 'arrow function with expression body',
      },
      {
        code: 'const mod = require(`./target`);',
        title: 'template literal require call without expressions',
      },
      {
        code: "try {} catch (error) { require('./target'); }",
        title: 'catch clause parameter named error',
      },
      {
        code: "try {} catch {} require('./target');",
        title: 'optional catch clause without parameter',
      },
      {
        code: "{ const x = 1; require('./target'); }",
        title: 'unshadowed block scope',
      },
      {
        code: "class Other {} require('./target');",
        title: 'class declaration named Other',
      },
      {
        code: "function other() {} require('./target');",
        title: 'function declaration named other',
      },
      {
        code: "enum Other { A } require('./target');",
        title: 'enum declaration named Other',
      },
      {
        code: "namespace Other {} require('./target');",
        title: 'namespace declaration named Other',
      },
      {
        code: "import other from './mod'; require('./target');",
        title: 'import declaration named other',
      },
      {
        code: "import other = require('./mod'); require('./target');",
        title: 'import equals named other',
      },
      {
        code: "const other = 1; require('./target');",
        title: 'variable declaration named other',
      },
    ])('extracts require when not shadowed in $title', ({ code }) => {
      const result = parseAndExtractTraversal(code);
      const targetImport = result.inlineImports.find(
        (item) => item.specifier === './target'
      );
      expect(targetImport?.kind).toBe('require-call');
      expect(targetImport?.isTypeOnly).toBe(false);
    });

    it.each([
      {
        code: "function loader(require: any) { return require('./target'); }",
        title: 'parameter',
      },
      {
        code: "function f([require]: any) { return require('./target'); }",
        title: 'array pattern parameter',
      },
      {
        code: "function f({ require }: any) { return require('./target'); }",
        title: 'object pattern parameter',
      },
      {
        code: "function f({ ...require }: any) { return require('./target'); }",
        title: 'object rest pattern parameter',
      },
      {
        code: "function f([...require]: any) { return require('./target'); }",
        title: 'array rest pattern parameter',
      },
      {
        code: "function f(require = 1) { return require('./target'); }",
        title: 'assignment pattern parameter',
      },
      {
        code: "class require {} require('./target');",
        title: 'class declaration',
      },
      {
        code: "enum require { A } require('./target');",
        title: 'enum declaration',
      },
      {
        code: "namespace require {} require('./target');",
        title: 'namespace declaration',
      },
      {
        code: "import require from './mod'; require('./target');",
        title: 'import default declaration',
      },
      {
        code: "import require = require('./mod'); require('./target');",
        title: 'import equals declaration',
      },
      {
        code: "const f = (require: any) => require('./target');",
        title: 'arrow function parameter',
      },
      {
        code: "const f = function require() { return require('./target'); };",
        title: 'named function expression',
      },
      {
        code: "function execute() { const require = () => {}; return require('./target'); }",
        title: 'local variable',
      },
      {
        code: "{ const require = () => {}; require('./target'); }",
        title: 'block scope local variable',
      },
      {
        code: "const { ...require } = obj; require('./target');",
        title: 'object rest pattern',
      },
      {
        code: "const [...require] = arr; require('./target');",
        title: 'array rest pattern',
      },
      {
        code: "try {} catch (require) { require('./target'); }",
        title: 'catch clause parameter',
      },
      {
        code: "try {} catch { const require = 1; require('./target'); }",
        title: 'optional catch without parameter',
      },
      {
        code: "function require(name: string) { return name; } require('./target');",
        title: 'top-level function',
      },
    ])('does not extract require when shadowed by $title', ({ code }) => {
      const result = parseAndExtractTraversal(code);
      expect(result.inlineImports).toHaveLength(0);
      expect(result.unsupportedSyntaxes).toHaveLength(0);
    });

    it.each([
      {
        code: 'const mod = require();',
        title: 'require with 0 arguments',
      },
      {
        code: "const mod = require('a', 'b');",
        title: 'require with multiple arguments',
      },
      {
        code: 'const mod = require(dynamicPackageName);',
        title: 'require with identifier argument',
      },
      {
        code: 'const mod = require(`./mod/${x}`);',
        title: 'require with template expression',
      },
    ])('reports unsupported syntax for $title', ({ code }) => {
      const result = parseAndExtractTraversal(code);
      expect(result.inlineImports).toHaveLength(0);
      expect(result.unsupportedSyntaxes).toHaveLength(1);
      expect(result.unsupportedSyntaxes[0]?.description).toContain('require');
    });

    it('does not report unsupported syntax when shadowed require receives non-literal argument', () => {
      const code =
        'function require(name: string) { return name; } require(dynamicPackageName);';
      const result = parseAndExtractTraversal(code);
      expect(result.inlineImports).toHaveLength(0);
      expect(result.unsupportedSyntaxes).toHaveLength(0);
    });
  });

  describe('dynamic imports', () => {
    it.each([
      {
        code: "const p = import('./dynamic');",
        expectedKind: 'literal-dynamic-import',
        expectedSpecifier: './dynamic',
        title: 'string literal',
      },
      {
        code: 'const p = import(`./dynamic`);',
        expectedKind: 'literal-dynamic-import',
        expectedSpecifier: './dynamic',
        title: 'template literal without expressions',
      },
      {
        code: 'const p = import(dynamicModule);',
        expectedKind: 'non-literal-dynamic-import',
        expectedSpecifier: null,
        title: 'variable argument',
      },
      {
        code: 'const p = import(`./mod/${sub}`);',
        expectedKind: 'non-literal-dynamic-import',
        expectedSpecifier: null,
        title: 'template literal with expressions',
      },
    ])(
      'extracts dynamic import for $title',
      ({ code, expectedKind, expectedSpecifier }) => {
        const result = parseAndExtractTraversal(code);
        expect(result.inlineImports).toHaveLength(1);
        expect(result.inlineImports[0]?.kind).toBe(expectedKind);
        expect(result.inlineImports[0]?.specifier).toBe(expectedSpecifier);
        expect(result.inlineImports[0]?.isTypeOnly).toBe(false);
      }
    );
  });

  describe('type imports and unsupported constructs', () => {
    it('extracts typescript import type with isTypeOnly true', () => {
      const code = "type T = import('./contract').Widget;";
      const result = parseAndExtractTraversal(code);
      expect(result.inlineImports).toHaveLength(1);
      expect(result.inlineImports[0]?.kind).toBe('typescript-import-type');
      expect(result.inlineImports[0]?.specifier).toBe('./contract');
      expect(result.inlineImports[0]?.isTypeOnly).toBe(true);
    });

    it.each([
      {
        code: 'export = 42;',
        expectedSubstring: 'export =',
        title: 'TS export assignment',
      },
      {
        code: 'declare module "external-mod" {}',
        expectedSubstring: 'declare module',
        title: 'declare module',
      },
      {
        code: 'declare global { const x: number; }',
        expectedSubstring: 'declare global',
        title: 'declare global',
      },
    ])(
      'reports unsupported syntax for $title',
      ({ code, expectedSubstring }) => {
        const result = parseAndExtractTraversal(code);
        expect(result.unsupportedSyntaxes).toHaveLength(1);
        expect(result.unsupportedSyntaxes[0]?.description).toContain(
          expectedSubstring
        );
      }
    );
  });
});
