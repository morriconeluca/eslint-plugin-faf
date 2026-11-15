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

import type { TModuleExport } from '../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type { TSourceLocator } from '../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import {
  DEFAULT_NAME,
  LOCAL_SYMBOL_ORIGIN,
} from '../../_extract-module-exports@shared/_constants/module-exports.constant.js';

export function extractDeclarationExports(
  declaration: Statement,
  locator: TSourceLocator,
  exports: TModuleExport[],
  seenExportNames: Set<string>
): void {
  type TPatternIdentifier = {
    readonly name: string;
    readonly start: number;
  };

  const collectPatternIdentifiers = (
    pattern: BindingPattern | BindingRestElement,
    results: TPatternIdentifier[]
  ): void => {
    switch (pattern.type) {
      case 'ArrayPattern': {
        for (const element of pattern.elements) {
          if (element !== null) {
            collectPatternIdentifiers(element, results);
          }
        }
        return;
      }
      case 'AssignmentPattern': {
        collectPatternIdentifiers(pattern.left, results);
        return;
      }
      case 'Identifier': {
        results.push({ name: pattern.name, start: pattern.start });
        return;
      }
      case 'ObjectPattern': {
        for (const property of pattern.properties) {
          const next =
            property.type === 'Property' ? property.value : property.argument;
          collectPatternIdentifiers(next, results);
        }
        return;
      }
      case 'RestElement': {
        collectPatternIdentifiers(pattern.argument, results);
        return;
      }
    }
  };

  const extractVariableExports = (target: VariableDeclaration): void => {
    const identifiers: TPatternIdentifier[] = [];
    for (const declarator of target.declarations) {
      collectPatternIdentifiers(declarator.id, identifiers);
    }
    for (const item of identifiers) {
      seenExportNames.add(item.name);
      exports.push({
        exportedName: item.name,
        isTypeOnly: false,
        origin: { symbolName: item.name, type: LOCAL_SYMBOL_ORIGIN },
        position: locator(item.start),
      });
    }
  };

  const extractTypeExports = (
    target: TSInterfaceDeclaration | TSTypeAliasDeclaration
  ): void => {
    seenExportNames.add(target.id.name);
    exports.push({
      exportedName: target.id.name,
      isTypeOnly: true,
      origin: { symbolName: target.id.name, type: LOCAL_SYMBOL_ORIGIN },
      position: locator(target.id.start),
    });
  };

  const extractFunctionExports = (target: OxcFunction): void => {
    const name = target.id?.name ?? DEFAULT_NAME;
    if (seenExportNames.has(name)) {
      return;
    }
    seenExportNames.add(name);
    exports.push({
      exportedName: name,
      isTypeOnly: false,
      origin: { symbolName: name, type: LOCAL_SYMBOL_ORIGIN },
      position: locator(target.start),
    });
  };

  const extractClassExports = (target: Class | TSEnumDeclaration): void => {
    const name = target.id?.name ?? DEFAULT_NAME;
    seenExportNames.add(name);
    exports.push({
      exportedName: name,
      isTypeOnly: false,
      origin: { symbolName: name, type: LOCAL_SYMBOL_ORIGIN },
      position: locator(target.start),
    });
  };

  const extractNamespaceExports = (
    target: TSGlobalDeclaration | TSModuleDeclaration
  ): void => {
    if (target.kind !== 'namespace' || target.id.type !== 'Identifier') {
      return;
    }
    seenExportNames.add(target.id.name);
    exports.push({
      exportedName: target.id.name,
      isTypeOnly: false,
      origin: { symbolName: target.id.name, type: LOCAL_SYMBOL_ORIGIN },
      position: locator(target.id.start),
    });
  };

  const dispatch = (): void => {
    if (declaration.type === 'VariableDeclaration') {
      extractVariableExports(declaration);
      return;
    }
    if (
      declaration.type === 'TSInterfaceDeclaration' ||
      declaration.type === 'TSTypeAliasDeclaration'
    ) {
      extractTypeExports(declaration);
      return;
    }
    if (
      declaration.type === 'FunctionDeclaration' ||
      declaration.type === 'TSDeclareFunction'
    ) {
      extractFunctionExports(declaration);
      return;
    }
    if (
      declaration.type === 'ClassDeclaration' ||
      declaration.type === 'TSEnumDeclaration'
    ) {
      extractClassExports(declaration);
      return;
    }
    if (declaration.type === 'TSModuleDeclaration') {
      extractNamespaceExports(declaration);
    }
  };

  dispatch();
}
