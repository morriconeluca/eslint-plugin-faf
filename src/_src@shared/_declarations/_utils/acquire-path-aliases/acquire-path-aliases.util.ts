import type {
  TAcquirePathAliasesInput,
  TAcquirePathAliasesResult,
} from './acquire-path-aliases.type.js';

import {
  COMMON_ALIASES_PROPERTY_PATH,
  CONFIG_9_REFERENCE,
  DUPLICATE_ALIAS_SOURCE_CONSTRAINT,
  FAF_CONFIG_ELEMENT,
} from './_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { parsePackageJsonImports } from './_schemas/parse-package-json-imports/index.js';
import { convertCommonAliases } from './_utils/convert-common-aliases/index.js';

export function acquirePathAliases(
  input: TAcquirePathAliasesInput
): TAcquirePathAliasesResult {
  const rawImports = input.packageJson?.['imports'];
  const hasImportsField = rawImports !== undefined;
  const hasAliasesField = input.commonAliases !== undefined;

  if (hasImportsField) {
    const importsResult = parsePackageJsonImports(rawImports);

    if (!importsResult.ok) {
      return importsResult;
    }

    if (hasAliasesField) {
      return {
        ok: false,
        outcomes: [
          {
            constraint: DUPLICATE_ALIAS_SOURCE_CONSTRAINT,
            element: FAF_CONFIG_ELEMENT,
            family: 'configuration',
            message:
              'Path aliases must not be declared in both fafconfig.ts common.aliases and package.json imports',
            normativeReference: CONFIG_9_REFERENCE,
            propertyPath: COMMON_ALIASES_PROPERTY_PATH,
          },
        ],
      };
    }

    return importsResult;
  }

  if (input.commonAliases !== undefined) {
    return {
      ok: true,
      value: convertCommonAliases(input.commonAliases),
    };
  }

  return {
    ok: true,
    value: [],
  };
}
