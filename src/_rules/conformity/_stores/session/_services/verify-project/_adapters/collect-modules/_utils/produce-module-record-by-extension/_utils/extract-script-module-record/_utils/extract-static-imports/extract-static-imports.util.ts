import type { Statement } from 'oxc-parser';

import type { TModuleImport } from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../_extract-script-module-record@shared/_types/imported-binding.type.js';
import type { TSourceLocator } from '../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TStaticImportsResult } from './extract-static-imports.type.js';

import { extractImportEquals } from './_utils/extract-import-equals/index.js';
import { extractStaticExport } from './_utils/extract-static-export/index.js';
import { registerImportBindings } from './_utils/register-import-bindings/index.js';
import { resolveImportKind } from './_utils/resolve-import-kind/index.js';

export function extractStaticImports(
  body: readonly Statement[],
  locator: TSourceLocator
): TStaticImportsResult {
  const staticImports: TModuleImport[] = [];
  const bindingMap = new Map<string, TImportedBinding>();

  const processStatement = (statement: Statement): void => {
    if (statement.type === 'ImportDeclaration') {
      const specifier = statement.source.value;
      const { isTypeOnly, kind } = resolveImportKind(statement);
      staticImports.push({
        isTypeOnly,
        kind,
        position: locator(statement.start),
        specifier,
      });
      registerImportBindings(statement, specifier, bindingMap);
      return;
    }

    if (
      statement.type === 'ExportAllDeclaration' ||
      statement.type === 'ExportNamedDeclaration'
    ) {
      const exported = extractStaticExport(statement, locator);
      if (exported !== null) {
        staticImports.push(exported);
      }
      return;
    }

    if (statement.type !== 'TSImportEqualsDeclaration') {
      return;
    }

    const result = extractImportEquals(statement, locator);
    if (result === null) {
      return;
    }
    staticImports.push(result.staticImport);
    bindingMap.set(result.binding.localName, result.binding);
  };

  for (const statement of body) {
    processStatement(statement);
  }

  return { bindingMap, staticImports };
}
