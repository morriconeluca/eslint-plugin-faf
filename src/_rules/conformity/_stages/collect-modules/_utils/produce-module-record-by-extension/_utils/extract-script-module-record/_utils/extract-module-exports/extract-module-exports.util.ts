import type { ExportAllDeclaration, Statement } from 'oxc-parser';

import type {
  TModuleExport,
  TRootSymbol,
} from '../../../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TImportedBinding } from '../../_extract-script-module-record@shared/_types/imported-binding.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';

import { NAMESPACE_ORIGIN } from './_extract-module-exports@shared/_constants/module-exports.constant.js';
import { extractDeclarationExports } from './_utils/extract-declaration-exports/index.js';
import { extractDefaultExport } from './_utils/extract-default-export/index.js';
import { extractNamedSpecifiersExports } from './_utils/extract-named-specifiers-exports/index.js';

export function extractModuleExports(
  body: readonly Statement[],
  rootSymbols: readonly TRootSymbol[],
  importedBindings: ReadonlyMap<string, TImportedBinding>,
  locator: TSourceLocator
): readonly TModuleExport[] {
  const extractAllExport = (statement: ExportAllDeclaration): TModuleExport => {
    const isTypeOnly = statement.exportKind === 'type';
    const position = locator(statement.start);
    const specifier = statement.source.value;

    if (statement.exported !== null) {
      const exportedName =
        statement.exported.type === 'Literal'
          ? statement.exported.value
          : statement.exported.name;
      return {
        exportedName,
        isTypeOnly,
        origin: { specifier, type: NAMESPACE_ORIGIN },
        position,
      };
    }

    return {
      exportedName: '*',
      isTypeOnly,
      origin: { specifier, type: 'export-all' },
      position,
    };
  };

  const exports: TModuleExport[] = [];
  const seenExportNames = new Set<string>();

  const processStatement = (statement: Statement): void => {
    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration === null) {
        extractNamedSpecifiersExports(
          statement,
          rootSymbols,
          importedBindings,
          locator,
          exports
        );
      } else {
        extractDeclarationExports(
          statement.declaration,
          locator,
          exports,
          seenExportNames
        );
      }
      return;
    }

    if (statement.type === 'ExportAllDeclaration') {
      exports.push(extractAllExport(statement));
      return;
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push(
        extractDefaultExport(statement, rootSymbols, importedBindings, locator)
      );
    }
  };

  for (const statement of body) {
    processStatement(statement);
  }

  return exports;
}
