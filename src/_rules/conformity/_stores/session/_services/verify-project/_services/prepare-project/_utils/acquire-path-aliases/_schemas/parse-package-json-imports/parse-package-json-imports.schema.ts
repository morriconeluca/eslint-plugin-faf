import type {
  TConfigOutcome,
  TResult,
} from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TEffectivePathAlias } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { collectSubpathTargets } from './_schemas/collect-subpath-targets/index.js';
import { importsObjectSchema } from './_schemas/imports-object-schema/index.js';
import { validateSubpathKey } from './_utils/validate-subpath-key/index.js';

export function parsePackageJsonImports(
  rawImports: unknown
): TResult<readonly TEffectivePathAlias[]> {
  const parsedImports = importsObjectSchema.safeParse(rawImports);
  if (!parsedImports.success) {
    return {
      ok: false,
      outcomes: [
        createOutcome('configuration/invalid-alias-source', {
          detail: 'package.json imports must be a JSON object',
          element: PACKAGE_JSON_ELEMENT,
          propertyPath: PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
        }),
      ],
    };
  }

  const outcomes: TConfigOutcome[] = [];
  const aliases: TEffectivePathAlias[] = [];

  const processEntry = (
    key: string,
    rawValue: unknown
  ): null | TConfigOutcome => {
    const keyResult = validateSubpathKey(key);

    if ('outcome' in keyResult) {
      return keyResult.outcome;
    }

    const targetResult = collectSubpathTargets(
      rawValue,
      key,
      keyResult.hasWildcardKey
    );

    if ('outcome' in targetResult) {
      return targetResult.outcome;
    }

    if (targetResult.targets.length > 0) {
      aliases.push({
        prefix: keyResult.prefix,
        source: 'package.json#imports',
        targets: targetResult.targets,
      });
    }

    return null;
  };

  for (const [key, rawValue] of Object.entries(parsedImports.data)) {
    const outcome = processEntry(key, rawValue);
    if (outcome !== null) {
      outcomes.push(outcome);
    }
  }

  if (outcomes.length > 0) {
    return {
      ok: false,
      outcomes,
    };
  }

  return {
    ok: true,
    value: aliases,
  };
}
