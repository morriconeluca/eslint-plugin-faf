import type {
  BindingPattern,
  BindingRestElement,
  Class,
  ExportDefaultDeclaration,
  IdentifierReference,
  Function as OxcFunction,
  Statement,
  TSEnumDeclaration,
  TSGlobalDeclaration,
  TSInterfaceDeclaration,
  TSModuleDeclaration,
  TSTypeAliasDeclaration,
  VariableDeclaration,
} from 'oxc-parser';

import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';

import type { TRootSymbol } from '../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TImportedBinding } from './extract-module-exports.type.js';

import { createSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import { extractModuleExports } from './index.js';

const collectPatternSymbols = (
  pattern: BindingPattern | BindingRestElement,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  switch (pattern.type) {
    case 'ArrayPattern': {
      for (const element of pattern.elements) {
        if (element !== null) {
          collectPatternSymbols(element, locator, symbols);
        }
      }
      return;
    }
    case 'AssignmentPattern': {
      collectPatternSymbols(pattern.left, locator, symbols);
      return;
    }
    case 'Identifier': {
      symbols.push({
        name: pattern.name,
        position: locator(pattern.start),
        space: 'value',
      });
      return;
    }
    case 'ObjectPattern': {
      for (const property of pattern.properties) {
        const next =
          property.type === 'Property' ? property.value : property.argument;
        collectPatternSymbols(next, locator, symbols);
      }
      return;
    }
    case 'RestElement': {
      collectPatternSymbols(pattern.argument, locator, symbols);
      return;
    }
  }
};

const isValueDeclaration = (
  target: Class | Statement | TSEnumDeclaration
): boolean =>
  target.type === 'ClassDeclaration' ||
  target.type === 'FunctionDeclaration' ||
  target.type === 'TSEnumDeclaration' ||
  target.type === 'VariableDeclaration';

const hasNamespaceValue = (body: TSModuleDeclaration['body']): boolean => {
  if (body === null) {
    return false;
  }
  return body.body.some((statement) => {
    const target =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null
        ? statement.declaration
        : statement;
    if (isValueDeclaration(target)) {
      return true;
    }
    if (target.type === 'TSModuleDeclaration') {
      return hasNamespaceValue(target.body);
    }
    return false;
  });
};

const pushNamedSymbol = (
  name: string,
  offset: number,
  space: TRootSymbol['space'],
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  symbols.push({ name, position: locator(offset), space });
};

const collectVariableSymbols = (
  target: VariableDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  for (const declarator of target.declarations) {
    collectPatternSymbols(declarator.id, locator, symbols);
  }
};

const collectNamespaceSymbol = (
  target: TSGlobalDeclaration | TSModuleDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  if (target.kind !== 'namespace' || target.id.type !== 'Identifier') {
    return;
  }
  pushNamedSymbol(
    target.id.name,
    target.id.start,
    hasNamespaceValue(target.body) ? 'value' : 'type',
    locator,
    symbols
  );
};

const collectFunctionSymbol = (
  target: OxcFunction,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>
): void => {
  if (target.id === null) {
    pushNamedSymbol('default', target.start, 'value', locator, symbols);
    return;
  }
  if (seenFunctions.has(target.id.name)) {
    return;
  }
  seenFunctions.add(target.id.name);
  pushNamedSymbol(target.id.name, target.id.start, 'value', locator, symbols);
};

const collectClassSymbol = (
  target: Class,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  if (target.id === null) {
    pushNamedSymbol('default', target.start, 'value', locator, symbols);
    return;
  }
  pushNamedSymbol(target.id.name, target.id.start, 'value', locator, symbols);
};

const collectEnumSymbol = (
  target: TSEnumDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  pushNamedSymbol(target.id.name, target.id.start, 'value', locator, symbols);
};

const collectTypeSymbol = (
  target: TSInterfaceDeclaration | TSTypeAliasDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  pushNamedSymbol(target.id.name, target.id.start, 'type', locator, symbols);
};

const collectStatementSymbols = (
  target: Statement,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>
): void => {
  if (target.type === 'VariableDeclaration') {
    collectVariableSymbols(target, locator, symbols);
    return;
  }
  if (target.type === 'TSModuleDeclaration') {
    collectNamespaceSymbol(target, locator, symbols);
    return;
  }
  if (
    target.type === 'FunctionDeclaration' ||
    target.type === 'TSDeclareFunction'
  ) {
    collectFunctionSymbol(target, locator, symbols, seenFunctions);
    return;
  }
  if (target.type === 'ClassDeclaration') {
    collectClassSymbol(target, locator, symbols);
    return;
  }
  if (target.type === 'TSEnumDeclaration') {
    collectEnumSymbol(target, locator, symbols);
    return;
  }
  if (
    target.type === 'TSInterfaceDeclaration' ||
    target.type === 'TSTypeAliasDeclaration'
  ) {
    collectTypeSymbol(target, locator, symbols);
  }
};

const collectDefaultClassSymbol = (
  statement: ExportDefaultDeclaration,
  declaration: Class,
  locator: TSourceLocator,
  symbols: TRootSymbol[]
): void => {
  pushNamedSymbol(
    declaration.id?.name ?? 'default',
    statement.start,
    'value',
    locator,
    symbols
  );
};

const collectDefaultFunctionSymbol = (
  statement: ExportDefaultDeclaration,
  declaration: OxcFunction,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>
): void => {
  if (declaration.id === null) {
    pushNamedSymbol('default', statement.start, 'value', locator, symbols);
    return;
  }
  if (seenFunctions.has(declaration.id.name)) {
    return;
  }
  seenFunctions.add(declaration.id.name);
  pushNamedSymbol(
    declaration.id.name,
    declaration.id.start,
    'value',
    locator,
    symbols
  );
};

const collectDefaultIdentifierSymbol = (
  declaration: IdentifierReference,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  importedNames: ReadonlySet<string>
): void => {
  const isKnown =
    symbols.some((symbol) => symbol.name === declaration.name) ||
    importedNames.has(declaration.name);
  if (!isKnown) {
    pushNamedSymbol('default', declaration.start, 'value', locator, symbols);
  }
};

const collectDefaultSymbol = (
  statement: ExportDefaultDeclaration,
  locator: TSourceLocator,
  symbols: TRootSymbol[],
  seenFunctions: Set<string>,
  importedNames: ReadonlySet<string>
): void => {
  const declaration = statement.declaration;
  if (declaration.type === 'ClassDeclaration') {
    collectDefaultClassSymbol(statement, declaration, locator, symbols);
    return;
  }
  if (declaration.type === 'FunctionDeclaration') {
    collectDefaultFunctionSymbol(
      statement,
      declaration,
      locator,
      symbols,
      seenFunctions
    );
    return;
  }
  if (declaration.type === 'Identifier') {
    collectDefaultIdentifierSymbol(
      declaration,
      locator,
      symbols,
      importedNames
    );
    return;
  }
  pushNamedSymbol('default', declaration.start, 'value', locator, symbols);
};

const collectFixtureSymbols = (
  body: readonly Statement[],
  locator: TSourceLocator,
  importedNames: ReadonlySet<string>
): readonly TRootSymbol[] => {
  const symbols: TRootSymbol[] = [];
  const seenFunctions = new Set<string>();
  for (const statement of body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      continue;
    }
    const target =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null
        ? statement.declaration
        : statement;
    collectStatementSymbols(target, locator, symbols, seenFunctions);
  }
  for (const statement of body) {
    if (statement.type !== 'ExportDefaultDeclaration') {
      continue;
    }
    collectDefaultSymbol(
      statement,
      locator,
      symbols,
      seenFunctions,
      importedNames
    );
  }
  return symbols;
};

const parseAndExtractExports = (
  sourceText: string,
  bindings: readonly TImportedBinding[] = []
) => {
  const parseResult = parseSync('test.ts', sourceText, {
    lang: 'ts',
    sourceType: 'module',
  });
  const locator = createSourceLocator(sourceText);
  const bindingMap = new Map(
    bindings.map((binding) => [binding.localName, binding])
  );
  const symbols = collectFixtureSymbols(
    parseResult.program.body,
    locator,
    new Set(bindings.map((binding) => binding.localName))
  );
  return extractModuleExports(
    parseResult.program.body,
    symbols,
    bindingMap,
    locator
  );
};

describe('extractModuleExports', () => {
  describe('re-export detection across 12 syntactic variants', () => {
    it.each([
      {
        code: "export { value } from './source';",
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'named re-export',
      },
      {
        code: "export { value as renamed } from './source';",
        expectedExportedName: 'renamed',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'renamed named re-export',
      },
      {
        code: "export { default } from './source';",
        expectedExportedName: 'default',
        expectedOrigin: {
          importedName: 'default',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'default re-export',
      },
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
        title: 'export star as namespace',
      },
      {
        code: "export type { Value } from './source';",
        expectedExportedName: 'Value',
        expectedOrigin: {
          importedName: 'Value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: true,
        title: 'export type named re-export',
      },
      {
        code: "export type * from './source';",
        expectedExportedName: '*',
        expectedOrigin: { specifier: './source', type: 'export-all' },
        isTypeOnly: true,
        title: 'export type star re-export',
      },
    ])(
      'detects inline re-export for $title',
      ({ code, expectedExportedName, expectedOrigin, isTypeOnly }) => {
        const exports = parseAndExtractExports(code);
        expect(exports).toHaveLength(1);
        expect(exports[0]?.exportedName).toBe(expectedExportedName);
        expect(exports[0]?.origin).toEqual(expectedOrigin);
        expect(exports[0]?.isTypeOnly).toBe(isTypeOnly);
      }
    );

    it.each([
      {
        bindings: [
          {
            importedName: 'value',
            isNamespace: false,
            isTypeOnly: false,
            localName: 'value',
            specifier: './source',
          },
        ],
        code: 'export { value };',
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'separate named re-export',
      },
      {
        bindings: [
          {
            importedName: 'value',
            isNamespace: false,
            isTypeOnly: false,
            localName: 'local',
            specifier: './source',
          },
        ],
        code: 'export { local as value };',
        expectedExportedName: 'value',
        expectedOrigin: {
          importedName: 'value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'separate renamed re-export',
      },
      {
        bindings: [
          {
            importedName: 'default',
            isNamespace: false,
            isTypeOnly: false,
            localName: 'value',
            specifier: './source',
          },
        ],
        code: 'export default value;',
        expectedExportedName: 'default',
        expectedOrigin: {
          importedName: 'default',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: false,
        title: 'export default of imported binding',
      },
      {
        bindings: [
          {
            importedName: '*',
            isNamespace: true,
            isTypeOnly: false,
            localName: 'source',
            specifier: './source',
          },
        ],
        code: 'export { source };',
        expectedExportedName: 'source',
        expectedOrigin: { specifier: './source', type: 'namespace' },
        isTypeOnly: false,
        title: 're-export of namespace import',
      },
      {
        bindings: [
          {
            importedName: 'Value',
            isNamespace: false,
            isTypeOnly: true,
            localName: 'Value',
            specifier: './source',
          },
        ],
        code: 'export type { Value };',
        expectedExportedName: 'Value',
        expectedOrigin: {
          importedName: 'Value',
          specifier: './source',
          type: 'imported-binding',
        },
        isTypeOnly: true,
        title: 're-export of imported type binding',
      },
      {
        bindings: [
          {
            importedName: '*',
            isNamespace: true,
            isTypeOnly: false,
            localName: 'ns',
            specifier: './source',
          },
        ],
        code: 'export default ns;',
        expectedExportedName: 'default',
        expectedOrigin: { specifier: './source', type: 'namespace' },
        isTypeOnly: false,
        title: 'export default of imported namespace',
      },
    ])(
      'detects separate re-export for $title',
      ({
        bindings,
        code,
        expectedExportedName,
        expectedOrigin,
        isTypeOnly,
      }) => {
        const exports = parseAndExtractExports(code, bindings);
        expect(exports).toHaveLength(1);
        expect(exports[0]?.exportedName).toBe(expectedExportedName);
        expect(exports[0]?.origin).toEqual(expectedOrigin);
        expect(exports[0]?.isTypeOnly).toBe(isTypeOnly);
      }
    );
  });

  describe('local symbol exports', () => {
    it('recognizes separately exported local definition as local-symbol origin', () => {
      const code = 'const value = 1; export { value };';
      const exports = parseAndExtractExports(code);
      expect(exports).toHaveLength(1);
      expect(exports[0]?.exportedName).toBe('value');
      expect(exports[0]?.origin).toEqual({
        symbolName: 'value',
        type: 'local-symbol',
      });
    });

    it('recognizes declaration initialized with imported binding as local-symbol', () => {
      const code = 'export const y = x;';
      const importedBindings: TImportedBinding[] = [
        {
          importedName: 'x',
          isNamespace: false,
          isTypeOnly: false,
          localName: 'x',
          specifier: './source',
        },
      ];
      const exports = parseAndExtractExports(code, importedBindings);
      expect(exports).toHaveLength(1);
      expect(exports[0]?.exportedName).toBe('y');
      expect(exports[0]?.origin).toEqual({
        symbolName: 'y',
        type: 'local-symbol',
      });
    });

    it.each([
      {
        code: 'const X = 1; type X = number; export { X };',
        expectedIsTypeOnly: false,
        title: 'merged value and type declarations',
      },
      {
        code: "export { type a } from './source';",
        expectedIsTypeOnly: true,
        title: 'inline re-export with type specifier',
      },
      {
        code: "export { a } from './source';",
        expectedIsTypeOnly: false,
        title: 'inline re-export with value specifier',
      },
      {
        code: 'const a = 1; export { type a };',
        expectedIsTypeOnly: true,
        title: 'separate export with type specifier',
      },
    ])(
      'evaluates isTypeOnly status for $title',
      ({ code, expectedIsTypeOnly }) => {
        const exports = parseAndExtractExports(code);
        expect(exports).toHaveLength(1);
        expect(exports[0]?.isTypeOnly).toBe(expectedIsTypeOnly);
      }
    );

    it('handles function overloads in export declarations without duplicating exports', () => {
      const code =
        'export function f(x: string): string; export function f(x: any) { return x; }';
      const exports = parseAndExtractExports(code);
      expect(exports).toHaveLength(1);
      expect(exports[0]?.exportedName).toBe('f');
    });

    it('handles pattern exports with rest and assignment elements in arrays and objects', () => {
      const code = `
        export const [first = 1, ...rest] = arr;
        export const { a = 2, ...other } = obj;
      `;
      const exports = parseAndExtractExports(code);
      expect(exports.map((exportedItem) => exportedItem.exportedName)).toEqual([
        'first',
        'rest',
        'a',
        'other',
      ]);
      expect(exports[0]?.isTypeOnly).toBe(false);
      expect(exports[1]?.isTypeOnly).toBe(false);
      expect(exports[2]?.isTypeOnly).toBe(false);
      expect(exports[3]?.isTypeOnly).toBe(false);
    });

    it('ignores non-identifier or ambient module declarations in exports', () => {
      const code = 'export declare module "external" {}';
      const exports = parseAndExtractExports(code);
      expect(exports).toHaveLength(0);
    });

    it('handles inline export declarations for functions, classes, enums, namespaces and types', () => {
      const code = `
        export const a = 1, { b } = { b: 2 };
        export function f() {}
        export class C {}
        export enum E { First }
        export interface I {}
        export namespace N { export const item = 1; }
      `;
      const exports = parseAndExtractExports(code);
      expect(exports).toHaveLength(7);
      expect(exports.map((exportedItem) => exportedItem.exportedName)).toEqual([
        'a',
        'b',
        'f',
        'C',
        'E',
        'I',
        'N',
      ]);
      expect(exports[0]?.isTypeOnly).toBe(false);
      expect(exports[1]?.isTypeOnly).toBe(false);
      expect(exports[2]?.isTypeOnly).toBe(false);
      expect(exports[3]?.isTypeOnly).toBe(false);
      expect(exports[4]?.isTypeOnly).toBe(false);
      expect(exports[5]?.isTypeOnly).toBe(true);
      expect(exports[6]?.isTypeOnly).toBe(false);
    });

    it.each([
      {
        code: 'export default function execute() {}',
        expectedName: 'default',
        expectedSymbol: 'execute',
        title: 'named function default export',
      },
      {
        code: 'export default function () {}',
        expectedName: 'default',
        expectedSymbol: 'default',
        title: 'anonymous function default export',
      },
      {
        code: 'export default class Widget {}',
        expectedName: 'default',
        expectedSymbol: 'Widget',
        title: 'named class default export',
      },
      {
        code: 'export default class {}',
        expectedName: 'default',
        expectedSymbol: 'default',
        title: 'anonymous class default export',
      },
      {
        code: 'export default 42;',
        expectedName: 'default',
        expectedSymbol: 'default',
        title: 'literal expression default export',
      },
      {
        code: 'const val = 1; export default val;',
        expectedName: 'default',
        expectedSymbol: 'val',
        title: 'local identifier default export',
      },
    ])(
      'handles export default forms for $title',
      ({ code, expectedName, expectedSymbol }) => {
        const exports = parseAndExtractExports(code);
        expect(exports).toHaveLength(1);
        expect(exports[0]?.exportedName).toBe(expectedName);
        expect(exports[0]?.origin).toEqual({
          symbolName: expectedSymbol,
          type: 'local-symbol',
        });
        expect(exports[0]?.isTypeOnly).toBe(false);
      }
    );
  });
});
