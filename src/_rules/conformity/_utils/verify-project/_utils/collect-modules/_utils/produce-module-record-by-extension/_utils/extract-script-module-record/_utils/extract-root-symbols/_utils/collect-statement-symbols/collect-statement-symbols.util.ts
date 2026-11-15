import type {
  BindingPattern,
  BindingRestElement,
  Class,
  Function as OxcFunction,
  Statement,
  TSEnumDeclaration,
  TSGlobalDeclaration,
  TSInterfaceDeclaration,
  TSModuleDeclaration,
  TSTypeAliasDeclaration,
  VariableDeclaration,
} from 'oxc-parser';

import type { TRootSymbol } from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

export const collectStatementSymbols = (() => {
  const VALUE_STATEMENT_TYPES = new Set([
    'ClassDeclaration',
    'FunctionDeclaration',
    'TSEnumDeclaration',
    'VariableDeclaration',
  ]);

  const isValueStatement = (statement: Statement): boolean => {
    const target =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration !== null
        ? statement.declaration
        : statement;

    return (
      VALUE_STATEMENT_TYPES.has(target.type) ||
      (target.type === 'TSModuleDeclaration' &&
        hasValueDeclaration(target.body))
    );
  };

  const hasValueDeclaration = (body: TSModuleDeclaration['body']): boolean =>
    body !== null && body.body.some((statement) => isValueStatement(statement));

  const collectPatternBindings = (
    pattern: BindingPattern | BindingRestElement,
    locator: TSourceLocator,
    symbols: TRootSymbol[]
  ): void => {
    switch (pattern.type) {
      case 'ArrayPattern': {
        for (const element of pattern.elements) {
          if (element !== null) {
            collectPatternBindings(element, locator, symbols);
          }
        }
        return;
      }
      case 'AssignmentPattern': {
        collectPatternBindings(pattern.left, locator, symbols);
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
          collectPatternBindings(next, locator, symbols);
        }
        return;
      }
      case 'RestElement': {
        collectPatternBindings(pattern.argument, locator, symbols);
        return;
      }
    }
  };

  const collectVariableSymbols = (
    statement: VariableDeclaration,
    locator: TSourceLocator,
    symbols: TRootSymbol[]
  ): void => {
    for (const declarator of statement.declarations) {
      collectPatternBindings(declarator.id, locator, symbols);
    }
  };

  const collectNamespaceSymbols = (
    statement: TSGlobalDeclaration | TSModuleDeclaration,
    locator: TSourceLocator,
    symbols: TRootSymbol[]
  ): void => {
    if (statement.kind !== 'namespace' || statement.id.type !== 'Identifier') {
      return;
    }
    const space = hasValueDeclaration(statement.body) ? 'value' : 'type';
    symbols.push({
      name: statement.id.name,
      position: locator(statement.id.start),
      space,
    });
  };

  const collectFunctionSymbols = (
    statement: OxcFunction,
    locator: TSourceLocator,
    symbols: TRootSymbol[],
    seenFunctions: Set<string>
  ): void => {
    if (statement.id === null) {
      symbols.push({
        name: 'default',
        position: locator(statement.start),
        space: 'value',
      });
      return;
    }
    const name = statement.id.name;
    if (seenFunctions.has(name)) {
      return;
    }
    seenFunctions.add(name);
    symbols.push({
      name,
      position: locator(statement.id.start),
      space: 'value',
    });
  };

  const collectClassOrEnumSymbols = (
    statement: Class | TSEnumDeclaration,
    locator: TSourceLocator,
    symbols: TRootSymbol[]
  ): void => {
    if (statement.id === null) {
      symbols.push({
        name: 'default',
        position: locator(statement.start),
        space: 'value',
      });
      return;
    }
    symbols.push({
      name: statement.id.name,
      position: locator(statement.id.start),
      space: 'value',
    });
  };

  const collectTypeSymbols = (
    statement: TSInterfaceDeclaration | TSTypeAliasDeclaration,
    locator: TSourceLocator,
    symbols: TRootSymbol[]
  ): void => {
    symbols.push({
      name: statement.id.name,
      position: locator(statement.id.start),
      space: 'type',
    });
  };

  return function collectStatementSymbols(
    target: Statement,
    locator: TSourceLocator,
    symbols: TRootSymbol[],
    seenFunctions: Set<string>
  ): void {
    if (target.type === 'VariableDeclaration') {
      collectVariableSymbols(target, locator, symbols);
      return;
    }
    if (target.type === 'TSModuleDeclaration') {
      collectNamespaceSymbols(target, locator, symbols);
      return;
    }
    if (
      target.type === 'FunctionDeclaration' ||
      target.type === 'TSDeclareFunction'
    ) {
      collectFunctionSymbols(target, locator, symbols, seenFunctions);
      return;
    }
    if (
      target.type === 'ClassDeclaration' ||
      target.type === 'TSEnumDeclaration'
    ) {
      collectClassOrEnumSymbols(target, locator, symbols);
      return;
    }
    if (
      target.type === 'TSInterfaceDeclaration' ||
      target.type === 'TSTypeAliasDeclaration'
    ) {
      collectTypeSymbols(target, locator, symbols);
    }
  };
})();
