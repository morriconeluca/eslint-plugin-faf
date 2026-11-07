import type {
  TAcquirePathAliasesInput,
  TAcquirePathAliasesResult,
} from './acquire-path-aliases.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  COMMON_ALIASES_PROPERTY_PATH,
  FAF_CONFIG_ELEMENT,
} from './_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { convertCommonAliases } from './_utils/convert-common-aliases/index.js';
import { parsePackageJsonImports } from './_utils/parse-package-json-imports/index.js';

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
          createOutcome('configuration/duplicate-alias-source', {
            element: FAF_CONFIG_ELEMENT,
            propertyPath: COMMON_ALIASES_PROPERTY_PATH,
          }),
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
