import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import { createSourceLocator } from '../create-source-locator/index.js';
import { extractRootSymbols } from './index.js';

const parseAndExtractSymbols = (
  sourceText: string,
  importedNames: readonly string[] = []
) => {
  const parseResult = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  return extractRootSymbols(
    parseResult.program.body,
    locator,
    new Set(importedNames)
  );
};

describe('extractRootSymbols', () => {
  it.each([
    {
      code: 'const value = 1;',
      expectedCount: 1,
      expectedNames: ['value'],
      title: 'single variable declaration',
    },
    {
      code: 'const first = 1, second = 2;',
      expectedCount: 2,
      expectedNames: ['first', 'second'],
      title: 'multiple variable declarators',
    },
    {
      code: 'const { first, second } = source;',
      expectedCount: 2,
      expectedNames: ['first', 'second'],
      title: 'object destructuring',
    },
    {
      code: 'const [first, second] = source;',
      expectedCount: 2,
      expectedNames: ['first', 'second'],
      title: 'array destructuring',
    },
    {
      code: 'const { value: renamed } = source;',
      expectedCount: 1,
      expectedNames: ['renamed'],
      title: 'renamed object destructuring',
    },
    {
      code: 'const [x = 1] = arr;',
      expectedCount: 1,
      expectedNames: ['x'],
      title: 'array assignment pattern',
    },
    {
      code: 'const { x = 1 } = obj;',
      expectedCount: 1,
      expectedNames: ['x'],
      title: 'object assignment pattern',
    },
    {
      code: 'const [...rest] = arr;',
      expectedCount: 1,
      expectedNames: ['rest'],
      title: 'array rest pattern',
    },
    {
      code: 'const value = 1; export { value, value as renamed };',
      expectedCount: 1,
      expectedNames: ['value'],
      title: 'declared and separately exported with alias',
    },
  ])('counts symbols for $title', ({ code, expectedCount, expectedNames }) => {
    const symbols = parseAndExtractSymbols(code);
    expect(symbols).toHaveLength(expectedCount);
    expect(symbols.map((symbol) => symbol.name)).toEqual(expectedNames);
  });

  it('counts 2 symbols for homonymous value and type declarations', () => {
    const symbols = parseAndExtractSymbols(
      'const Value = 1; type Value = number;'
    );
    expect(symbols).toHaveLength(2);
    expect(symbols[0]?.name).toBe('Value');
    expect(symbols[0]?.space).toBe('value');
    expect(symbols[1]?.name).toBe('Value');
    expect(symbols[1]?.space).toBe('type');
  });

  it('counts 1 symbol for overloaded function signatures with implementation', () => {
    const code =
      'function f(x: string): string; function f(x: number): number; function f(x: any): any { return x; }';
    const symbols = parseAndExtractSymbols(code);
    expect(symbols).toHaveLength(1);
    expect(symbols[0]?.name).toBe('f');
    expect(symbols[0]?.space).toBe('value');
  });

  it.each([
    {
      code: 'export default function () {}',
      expectedName: 'default',
      expectedSpace: 'value',
      title: 'anonymous export default function',
    },
    {
      code: 'export default class {}',
      expectedName: 'default',
      expectedSpace: 'value',
      title: 'anonymous export default class',
    },
    {
      code: 'export default 42;',
      expectedName: 'default',
      expectedSpace: 'value',
      title: 'export default expression',
    },
    {
      code: 'export default function execute() {}',
      expectedName: 'execute',
      expectedSpace: 'value',
      title: 'named export default function',
    },
    {
      code: 'export default class Widget {}',
      expectedName: 'Widget',
      expectedSpace: 'value',
      title: 'named export default class',
    },
  ])(
    'handles export default declaration for $title',
    ({ code, expectedName, expectedSpace }) => {
      const symbols = parseAndExtractSymbols(code);
      expect(symbols).toHaveLength(1);
      expect(symbols[0]?.name).toBe(expectedName);
      expect(symbols[0]?.space).toBe(expectedSpace);
    }
  );

  it.each([
    {
      code: 'class C {}',
      expectedName: 'C',
      expectedSpace: 'value',
      title: 'class declaration',
    },
    {
      code: 'enum E { A }',
      expectedName: 'E',
      expectedSpace: 'value',
      title: 'enum declaration',
    },
    {
      code: 'type T = string;',
      expectedName: 'T',
      expectedSpace: 'type',
      title: 'type alias declaration',
    },
  ])(
    'counts single symbol for $title',
    ({ code, expectedName, expectedSpace }) => {
      const symbols = parseAndExtractSymbols(code);
      expect(symbols).toHaveLength(1);
      expect(symbols[0]?.name).toBe(expectedName);
      expect(symbols[0]?.space).toBe(expectedSpace);
    }
  );

  it.each([
    {
      code: 'function f(parameter: number) { const local = parameter; function helper() {} return local; }',
      expectedCount: 1,
      expectedNames: ['f'],
      title: 'function with nested parameter, local, and helper function',
    },
    {
      code: 'class C { field = 1; method(parameter: number) { const local = parameter; return local; } }',
      expectedCount: 1,
      expectedNames: ['C'],
      title: 'class with field and method with parameters',
    },
    {
      code: 'interface A { x: string } interface A { y: string }',
      expectedCount: 2,
      expectedNames: ['A', 'A'],
      title: 'declaration merging of interfaces',
    },
    {
      code: 'function f() {} namespace f { export const x = 1; }',
      expectedCount: 2,
      expectedNames: ['f', 'f'],
      title: 'function and namespace declaration merging',
    },
    {
      code: "import { x } from './x'; export const y = x;",
      expectedCount: 1,
      expectedNames: ['y'],
      imported: ['x'],
      title: 'declaration initialized with imported binding',
    },
  ])(
    'evaluates root symbol count for $title',
    ({ code, expectedCount, expectedNames, imported }) => {
      const symbols = parseAndExtractSymbols(code, imported ?? []);
      expect(symbols).toHaveLength(expectedCount);
      expect(symbols.map((symbol) => symbol.name)).toEqual(expectedNames);
    }
  );

  it.each([
    {
      code: "import { x } from './x';",
      expectedCount: 0,
      expectedNames: [],
      imported: ['x'],
      title: 'import statements',
    },
    {
      code: 'export default x;',
      expectedCount: 0,
      expectedNames: [],
      imported: ['x'],
      title: 'export default referencing imported identifier',
    },
    {
      code: 'const x = 1; export default x;',
      expectedCount: 1,
      expectedNames: ['x'],
      imported: [],
      title: 'export default referencing locally declared identifier',
    },
    {
      code: 'export default undeclaredValue;',
      expectedCount: 1,
      expectedNames: ['default'],
      imported: [],
      title: 'export default referencing undeclared identifier',
    },
  ])(
    'evaluates symbol exclusion for $title',
    ({ code, expectedCount, expectedNames, imported }) => {
      const symbols = parseAndExtractSymbols(code, imported);
      expect(symbols).toHaveLength(expectedCount);
      expect(symbols.map((symbol) => symbol.name)).toEqual(expectedNames);
    }
  );

  it.each([
    {
      code: 'namespace Outer { namespace Inner { export const val = 1; } }',
      expectedName: 'Outer',
      expectedSpace: 'value',
      title: 'nested namespace with value',
    },
    {
      code: 'namespace Func { export function f() {} }',
      expectedName: 'Func',
      expectedSpace: 'value',
      title: 'namespace with function declaration',
    },
    {
      code: 'namespace Cls { export class C {} }',
      expectedName: 'Cls',
      expectedSpace: 'value',
      title: 'namespace with class declaration',
    },
    {
      code: 'namespace En { export enum E { A } }',
      expectedName: 'En',
      expectedSpace: 'value',
      title: 'namespace with enum declaration',
    },
    {
      code: 'namespace TypesOnly { export type A = string; }',
      expectedName: 'TypesOnly',
      expectedSpace: 'type',
      title: 'namespace containing only types',
    },
  ])(
    'determines namespace space for $title',
    ({ code, expectedName, expectedSpace }) => {
      const symbols = parseAndExtractSymbols(code);
      expect(symbols).toHaveLength(1);
      expect(symbols[0]?.name).toBe(expectedName);
      expect(symbols[0]?.space).toBe(expectedSpace);
    }
  );
});
