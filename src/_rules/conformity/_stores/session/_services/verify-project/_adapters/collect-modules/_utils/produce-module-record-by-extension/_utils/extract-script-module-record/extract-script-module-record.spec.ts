import { describe, expect, it } from 'vitest';

import type { TModuleRecordProducer } from '../../../../../../../../_session@shared/_types/module-record.type.js';

import { extractScriptModuleRecord } from './index.js';

describe('extractScriptModuleRecord', () => {
  it('satisfies TModuleRecordProducer contract type and returns script language', () => {
    const producer: TModuleRecordProducer = extractScriptModuleRecord;
    const record = producer('test.ts', 'const a = 1;');
    expect(record.language).toBe('script');
    expect(record.symbols).toHaveLength(1);
    expect(record.exports).toHaveLength(0);
    expect(record.imports).toHaveLength(0);
    expect(record.unsupportedSyntaxes).toHaveLength(0);
  });

  describe('FAF §4 normative symbol counting (19 rows)', () => {
    it.each([
      {
        code: 'const value = 1;',
        expectedSymbols: [{ name: 'value', space: 'value' }],
        title: 'single variable declaration',
      },
      {
        code: 'const first = 1, second = 2;',
        expectedSymbols: [
          { name: 'first', space: 'value' },
          { name: 'second', space: 'value' },
        ],
        title: 'multiple declarators',
      },
      {
        code: 'const { first, second } = source;',
        expectedSymbols: [
          { name: 'first', space: 'value' },
          { name: 'second', space: 'value' },
        ],
        title: 'object destructuring',
      },
      {
        code: 'const [first, second] = source;',
        expectedSymbols: [
          { name: 'first', space: 'value' },
          { name: 'second', space: 'value' },
        ],
        title: 'array destructuring',
      },
      {
        code: 'const { value: renamed } = source;',
        expectedSymbols: [{ name: 'renamed', space: 'value' }],
        title: 'renamed property destructuring',
      },
      {
        code: 'const Value = 1; type Value = number;',
        expectedSymbols: [
          { name: 'Value', space: 'value' },
          { name: 'Value', space: 'type' },
        ],
        title: 'value and type declaration merging',
      },
      {
        code: 'function f(x: string): string; function f(x: number): number; function f(x: any): any { return x; }',
        expectedSymbols: [{ name: 'f', space: 'value' }],
        title: 'overloads and implementation form 1 symbol',
      },
      {
        code: 'export default function () {}',
        expectedSymbols: [{ name: 'default', space: 'value' }],
        title: 'anonymous default function export',
      },
      {
        code: 'export default class {}',
        expectedSymbols: [{ name: 'default', space: 'value' }],
        title: 'anonymous default class export',
      },
      {
        code: 'export default 42;',
        expectedSymbols: [{ name: 'default', space: 'value' }],
        title: 'export default expression',
      },
      {
        code: 'function f(parameter: number) { const local = parameter; function helper() {} return local; }',
        expectedSymbols: [{ name: 'f', space: 'value' }],
        title: 'nested declarations do not count',
      },
      {
        code: 'class C { field = 1; method(parameter: number) { const local = parameter; return local; } }',
        expectedSymbols: [{ name: 'C', space: 'value' }],
        title: 'class members do not count',
      },
      {
        code: 'const value = 1; export { value, value as renamed };',
        expectedSymbols: [{ name: 'value', space: 'value' }],
        title: 'separate export with alias does not add symbol',
      },
      {
        code: 'interface A { x: string } interface A { y: string }',
        expectedSymbols: [
          { name: 'A', space: 'type' },
          { name: 'A', space: 'type' },
        ],
        title: 'interface merging counts each declaration',
      },
      {
        code: 'function f() {} namespace f { export const x = 1; }',
        expectedSymbols: [
          { name: 'f', space: 'value' },
          { name: 'f', space: 'value' },
        ],
        title: 'function and namespace merging counts both',
      },
      {
        code: 'class C {}',
        expectedSymbols: [{ name: 'C', space: 'value' }],
        title: 'class declaration is value',
      },
      {
        code: 'enum E { A }',
        expectedSymbols: [{ name: 'E', space: 'value' }],
        title: 'enum declaration is value',
      },
      {
        code: "import { x } from './x'; export const y = x;",
        expectedSymbols: [{ name: 'y', space: 'value' }],
        title: 'declaration initialized with imported binding is own symbol',
      },
      {
        code: "import { x } from './x';",
        expectedSymbols: [],
        title: 'import declarations introduce 0 symbols',
      },
    ])('Row: $title', ({ code, expectedSymbols }) => {
      const record = extractScriptModuleRecord('test.ts', code);
      expect(
        record.symbols.map((s) => ({ name: s.name, space: s.space }))
      ).toEqual(expectedSymbols);
    });
  });

  describe('the 13 JS/TS import syntax forms', () => {
    it.each([
      {
        code: "import { a } from './target';",
        expectedKind: 'named-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'named import',
      },
      {
        code: "import a from './target';",
        expectedKind: 'default-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'default import',
      },
      {
        code: "import * as a from './target';",
        expectedKind: 'namespace-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'namespace import',
      },
      {
        code: "import './target';",
        expectedKind: 'side-effect-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'side-effect import',
      },
      {
        code: "import type { a } from './target';",
        expectedKind: 'type-only-import',
        isTypeOnly: true,
        specifier: './target',
        title: 'import type',
      },
      {
        code: "import { type a, b } from './target';",
        expectedKind: 'mixed-type-specifier-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'mixed import with type specifier',
      },
      {
        code: "export { a } from './target';",
        expectedKind: 'export-named-from',
        isTypeOnly: false,
        specifier: './target',
        title: 'export named from',
      },
      {
        code: "export * from './target';",
        expectedKind: 'export-all-from',
        isTypeOnly: false,
        specifier: './target',
        title: 'export star from',
      },
      {
        code: "export type { a } from './target';",
        expectedKind: 'export-type-from',
        isTypeOnly: true,
        specifier: './target',
        title: 'export type from',
      },
      {
        code: "const p = import('./target');",
        expectedKind: 'literal-dynamic-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'literal dynamic import',
      },
      {
        code: "const p = require('./target');",
        expectedKind: 'require-call',
        isTypeOnly: false,
        specifier: './target',
        title: 'require call with loader binding',
      },
      {
        code: "import a = require('./target');",
        expectedKind: 'typescript-require-import',
        isTypeOnly: false,
        specifier: './target',
        title: 'typescript require import',
      },
      {
        code: "type T = import('./target').T;",
        expectedKind: 'typescript-import-type',
        isTypeOnly: true,
        specifier: './target',
        title: 'typescript import type',
      },
    ])('extracts $title', ({ code, expectedKind, isTypeOnly, specifier }) => {
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.kind).toBe(expectedKind);
      expect(record.imports[0]?.specifier).toBe(specifier);
      expect(record.imports[0]?.isTypeOnly).toBe(isTypeOnly);
    });
  });

  describe('strings that do not load modules', () => {
    it('does not invent imports for comments or normal variable assignments', () => {
      const code = `
        // import { target } from './commented-import';
        /* require('./commented-require'); */
        const text = "require('./assignment-path')";
        const query = "import('./dynamic-path')";
      `;
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(0);
      expect(record.unsupportedSyntaxes).toHaveLength(0);
    });

    it('does not invent imports for locally declared require function', () => {
      const code = `
        function require(moduleName: string) {
          return moduleName;
        }
        const result = require('./custom-path');
      `;
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(0);
    });
  });

  describe('re-export detection (12 rows with imported provenance)', () => {
    it.each([
      {
        code: "export { value } from './source';",
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'export { value } from ./source',
      },
      {
        code: "export { value as renamed } from './source';",
        expectedExportedName: 'renamed',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'export { value as renamed } from ./source',
      },
      {
        code: "export { default } from './source';",
        expectedExportedName: 'default',
        expectedOrigin: {
          importedName: 'default',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'export { default } from ./source',
      },
      {
        code: "export * from './source';",
        expectedExportedName: '*',
        expectedOrigin: { specifier: './source', type: 'export-all' },
        title: 'export * from ./source',
      },
      {
        code: "export * as source from './source';",
        expectedExportedName: 'source',
        expectedOrigin: { specifier: './source', type: 'namespace' },
        title: 'export * as source from ./source',
      },
      {
        code: "export type { Value } from './source';",
        expectedExportedName: 'Value',
        expectedOrigin: {
          importedName: 'Value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'export type { Value } from ./source',
      },
      {
        code: "export type * from './source';",
        expectedExportedName: '*',
        expectedOrigin: { specifier: './source', type: 'export-all' },
        title: 'export type * from ./source',
      },
      {
        code: "import { value } from './source'; export { value };",
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'import { value }; export { value };',
      },
      {
        code: "import { value as local } from './source'; export { local as value };",
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'import { value as local }; export { local as value };',
      },
      {
        code: "import value from './source'; export default value;",
        expectedExportedName: 'default',
        expectedOrigin: {
          importedName: 'default',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'import value; export default value;',
      },
      {
        code: "import * as source from './source'; export { source };",
        expectedExportedName: 'source',
        expectedOrigin: { specifier: './source', type: 'namespace' },
        title: 'import * as source; export { source };',
      },
      {
        code: "import type { Value } from './source'; export type { Value };",
        expectedExportedName: 'Value',
        expectedOrigin: {
          importedName: 'Value',
          specifier: './source',
          type: 'imported-binding',
        },
        title: 'import type { Value }; export type { Value };',
      },
    ])('Row: $title', ({ code, expectedExportedName, expectedOrigin }) => {
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.exports).toHaveLength(1);
      expect(record.exports[0]?.exportedName).toBe(expectedExportedName);
      expect(record.exports[0]?.origin).toEqual(expectedOrigin);
    });
  });

  describe('separate local definition export vs re-export', () => {
    it('identifies separate local definition export as local-symbol, not a re-export', () => {
      const code = 'const value = 1; export { value };';
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.exports).toHaveLength(1);
      expect(record.exports[0]?.origin).toEqual({
        symbolName: 'value',
        type: 'local-symbol',
      });
    });

    it('identifies declaration initialized with imported binding as local-symbol and sole symbol', () => {
      const code = "import { x } from './source'; export const y = x;";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.symbols).toHaveLength(1);
      expect(record.symbols[0]?.name).toBe('y');
      expect(record.exports).toHaveLength(1);
      expect(record.exports[0]?.exportedName).toBe('y');
      expect(record.exports[0]?.origin).toEqual({
        symbolName: 'y',
        type: 'local-symbol',
      });
    });
  });

  describe('Access Node exposure forms and definition prohibition', () => {
    it.each([
      {
        code: "export { Example } from './example.component';",
        title: 'named export of master',
      },
      {
        code: "export { Example as PublicExample } from './example.component';",
        title: 'aliased export of master',
      },
      {
        code: "export * from './example.component';",
        title: 'export star of master',
      },
      {
        code: "export { Example } from './example.component'; export type { ExampleProps } from './example.type';",
        title: 'master and type re-exports',
      },
      {
        code: "export { Example } from './example.component'; export type * from './example.type';",
        title: 'master and type star re-exports',
      },
      {
        code: "import { Example } from './example.component'; export { Example };",
        title: 'separate master re-export',
      },
      {
        code: "export * from './example.component'; export type * from './example.type';",
        title: 'star exports of master and type',
      },
    ])(
      'extracts Access Node exposure form for $title with 0 own symbols and imported origins',
      ({ code }) => {
        const record = extractScriptModuleRecord('index.ts', code);
        expect(record.symbols).toHaveLength(0);
        expect(record.exports.length).toBeGreaterThan(0);
        for (const exp of record.exports) {
          expect(['imported-binding', 'export-all', 'namespace']).toContain(
            exp.origin.type
          );
        }
      }
    );

    it.each([
      {
        code: 'export const value = 1;',
        expectedName: 'value',
        expectedSpace: 'value',
        title: 'export const',
      },
      {
        code: 'const hidden = 1;',
        expectedName: 'hidden',
        expectedSpace: 'value',
        title: 'const hidden',
      },
      {
        code: 'export function wrapper() {}',
        expectedName: 'wrapper',
        expectedSpace: 'value',
        title: 'export function',
      },
      {
        code: 'export type PublicType = string;',
        expectedName: 'PublicType',
        expectedSpace: 'type',
        title: 'export type',
      },
      {
        code: 'export interface PublicContract {}',
        expectedName: 'PublicContract',
        expectedSpace: 'type',
        title: 'export interface',
      },
      {
        code: 'export class PublicClass {}',
        expectedName: 'PublicClass',
        expectedSpace: 'value',
        title: 'export class',
      },
    ])(
      'extracts own symbols for Access Node violation scenario: $title',
      ({ code, expectedName, expectedSpace }) => {
        const record = extractScriptModuleRecord('index.ts', code);
        expect(record.symbols).toHaveLength(1);
        expect(record.symbols[0]?.name).toBe(expectedName);
        expect(record.symbols[0]?.space).toBe(expectedSpace);
      }
    );
  });

  describe('file extension language resolution and edge cases', () => {
    it.each([
      {
        code: 'const element = <div className="test" />;',
        path: 'component.tsx',
        title: 'tsx file',
      },
      {
        code: 'const element = <div className="test" />;',
        path: 'component.jsx',
        title: 'jsx file',
      },
      {
        code: 'const val = 1;',
        path: 'script.js',
        title: 'js file',
      },
      {
        code: 'export declare const val: number;',
        path: 'types.d.ts',
        title: 'dts file',
      },
    ])('parses $title cleanly', ({ code, path }) => {
      const record = extractScriptModuleRecord(path, code);
      expect(record.language).toBe('script');
      expect(record.unsupportedSyntaxes).toHaveLength(0);
    });

    it('handles TS internal import equals without external module reference', () => {
      const code = 'namespace A { export const B = 1; } import x = A.B;';
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(0);
      expect(record.symbols.map((s) => s.name)).toContain('A');
    });

    it('marks mixed import as typeOnly when all specifiers have type qualifier', () => {
      const code = "import { type A, type B } from './source';";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.kind).toBe('mixed-type-specifier-import');
      expect(record.imports[0]?.isTypeOnly).toBe(true);
    });

    it('records syntax error location accurately on multi-line text', () => {
      const code = '\n\n\nconst = ;';
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.unsupportedSyntaxes.length).toBeGreaterThan(0);
      expect(record.unsupportedSyntaxes[0]?.position.line).toBe(4);
    });

    it('defaults language to ts for paths without extension', () => {
      const code = 'const x: number = 42;';
      const record = extractScriptModuleRecord('extensionless', code);
      expect(record.language).toBe('script');
      expect(record.symbols).toHaveLength(1);
      expect(record.symbols[0]?.name).toBe('x');
    });

    it('resolves string literal in export specifier', () => {
      const code = "export { a as 'custom-alias' } from './source';";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.exports).toHaveLength(1);
      expect(record.exports[0]?.exportedName).toBe('custom-alias');
    });

    it('extracts template literal dynamic import specifier verbatim', () => {
      const code = 'const mod = import(`./exact-specifier`);';
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.specifier).toBe('./exact-specifier');
      expect(record.imports[0]?.isTypeOnly).toBe(false);
    });

    it('resolves typescript require import and separate re-export with default imported name', () => {
      const code = "import a = require('./mod'); export { a };";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.kind).toBe('typescript-require-import');
      expect(record.imports[0]?.isTypeOnly).toBe(false);
      expect(record.exports).toHaveLength(1);
      expect(record.exports[0]?.origin).toEqual({
        importedName: 'default',
        specifier: './mod',
        type: 'imported-binding',
      });
    });

    it('extracts typescript require import type with isTypeOnly true', () => {
      const code = "import type a = require('./mod');";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.isTypeOnly).toBe(true);
    });

    it('extracts combined import with default and named specifiers as named-import', () => {
      const code = "import a, { b } from './mod';";
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(1);
      expect(record.imports[0]?.kind).toBe('named-import');
    });

    it('extracts pure type mixed import vs value mixed import', () => {
      const pureTypeCode = "import { type A, type B } from './source';";
      const pureRecord = extractScriptModuleRecord('test.ts', pureTypeCode);
      expect(pureRecord.imports[0]?.isTypeOnly).toBe(true);
      expect(pureRecord.imports[0]?.kind).toBe('mixed-type-specifier-import');

      const mixedCode = "import { type A, b } from './source';";
      const mixedRecord = extractScriptModuleRecord('test.ts', mixedCode);
      expect(mixedRecord.imports[0]?.isTypeOnly).toBe(false);
      expect(mixedRecord.imports[0]?.kind).toBe('mixed-type-specifier-import');
    });

    it('distinguishes export-type-from and export-named-from for export named clauses', () => {
      const typeFromCode = "export { type A, type B } from './source';";
      const typeRecord = extractScriptModuleRecord('test.ts', typeFromCode);
      expect(typeRecord.imports[0]?.kind).toBe('export-type-from');
      expect(typeRecord.imports[0]?.isTypeOnly).toBe(true);

      const namedFromCode = "export { type A, b } from './source';";
      const namedRecord = extractScriptModuleRecord('test.ts', namedFromCode);
      expect(namedRecord.imports[0]?.kind).toBe('export-named-from');
      expect(namedRecord.imports[0]?.isTypeOnly).toBe(false);
    });

    it('distinguishes export type star from regular export star', () => {
      const typeStarCode = "export type * from './source';";
      const typeRecord = extractScriptModuleRecord('test.ts', typeStarCode);
      expect(typeRecord.imports[0]?.kind).toBe('export-type-from');
      expect(typeRecord.imports[0]?.isTypeOnly).toBe(true);

      const starCode = "export * from './source';";
      const starRecord = extractScriptModuleRecord('test.ts', starCode);
      expect(starRecord.imports[0]?.kind).toBe('export-all-from');
      expect(starRecord.imports[0]?.isTypeOnly).toBe(false);
    });

    it('correctly inserts out-of-order imports and preserves document order', () => {
      const code = `
        const dynamicFirst = import('./dynamic-first');
        import staticSecond from './static-second';
      `;
      const record = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(2);
      expect(record.imports[0]?.specifier).toBe('./dynamic-first');
      expect(record.imports[1]?.specifier).toBe('./static-second');
    });

    it('orders static, require, and dynamic imports deterministically by source position', () => {
      const code = `
        import first from './first';
        const second = require('./second');
        const third = import('./third');
      `;
      const record = extractScriptModuleRecord('test.ts', code);
      const repeated = extractScriptModuleRecord('test.ts', code);
      expect(record.imports).toHaveLength(3);
      expect(record.imports[0]?.specifier).toBe('./first');
      expect(record.imports[1]?.specifier).toBe('./second');
      expect(record.imports[2]?.specifier).toBe('./third');
      expect(repeated.imports).toEqual(record.imports);
      expect(repeated.symbols).toEqual(record.symbols);
      expect(repeated.exports).toEqual(record.exports);
      expect(repeated.unsupportedSyntaxes).toEqual(record.unsupportedSyntaxes);
    });
  });

  describe('performance on 2,000-line source file', () => {
    it('extracts module record from 2,000 lines and measures execution duration', () => {
      const lines: string[] = [
        "import { helper } from './helpers';",
        "import type { Configuration } from './types';",
        '',
      ];

      for (let index = 0; index < 1990; index += 1) {
        lines.push(`export const item${index} = helper(${index});`);
      }

      lines.push('', 'export default item0;');
      const largeSource = lines.join('\n');

      extractScriptModuleRecord('warmup.ts', 'const x = 1;');

      const startTime = performance.now();
      const record = extractScriptModuleRecord('large.ts', largeSource);
      const elapsedMilliseconds = performance.now() - startTime;

      expect(record.symbols).toHaveLength(1990);
      expect(record.exports).toHaveLength(1991);
      expect(record.imports).toHaveLength(2);
      expect(record.unsupportedSyntaxes).toHaveLength(0);
      expect(elapsedMilliseconds).toBeGreaterThan(0);

      console.log(
        `[Performance Test] 2,000 lines extracted in: ${elapsedMilliseconds.toFixed(2)} ms`
      );
    });

    it('infers typescript language when path contains no extension dot', () => {
      const record = extractScriptModuleRecord(
        'extensionless-file',
        'const x: number = 42;'
      );
      expect(record.symbols).toHaveLength(1);
      expect(record.symbols[0]?.name).toBe('x');
    });

    it('records oxc parsing errors as unsupported syntaxes', () => {
      const record = extractScriptModuleRecord('syntax-error.ts', 'const =;');
      expect(record.unsupportedSyntaxes).toHaveLength(1);
      expect(record.unsupportedSyntaxes[0]?.description).toContain(
        'Unexpected token'
      );
      expect(record.unsupportedSyntaxes[0]?.position).toEqual({
        column: 7,
        line: 1,
      });
    });
  });
});
