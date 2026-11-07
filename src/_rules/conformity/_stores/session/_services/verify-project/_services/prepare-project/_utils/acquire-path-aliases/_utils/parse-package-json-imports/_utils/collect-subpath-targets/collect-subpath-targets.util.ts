import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TCollectSubpathTargetsResult } from './collect-subpath-targets.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { importTargetNodeSchema } from './_schemas/import-target-node-schema/index.js';
import { resolveLocalSubpathTarget } from './_utils/resolve-local-subpath-target/index.js';

export function collectSubpathTargets(
  entryValue: unknown,
  subpathKey: string,
  hasWildcardKey: boolean
): TCollectSubpathTargetsResult {
  const targets: string[] = [];

  const invalidType = (value: unknown): TConfigOutcome =>
    createOutcome('configuration/invalid-alias-source', {
      detail: `Invalid package.json imports target type: ${typeof value}`,
      element: PACKAGE_JSON_ELEMENT,
      propertyPath: `${PACKAGE_JSON_IMPORTS_PROPERTY_PATH}.${subpathKey}`,
    });

  const traverse = (currentValue: unknown): null | TConfigOutcome => {
    const parsed = importTargetNodeSchema.safeParse(currentValue);
    if (!parsed.success) {
      return invalidType(currentValue);
    }
    if (typeof parsed.data === 'string') {
      const resolution = resolveLocalSubpathTarget(
        parsed.data,
        subpathKey,
        hasWildcardKey
      );
      if ('outcome' in resolution) {
        return resolution.outcome;
      }
      if (resolution.target !== null) {
        targets.push(resolution.target);
      }
      return null;
    }
    if (parsed.data === null) {
      return null;
    }
    const children = Array.isArray(parsed.data)
      ? parsed.data
      : Object.values(parsed.data);
    for (const item of children) {
      const outcome = traverse(item);
      if (outcome !== null) {
        return outcome;
      }
    }
    return null;
  };

  const failureOutcome = traverse(entryValue);
  if (failureOutcome !== null) {
    return { outcome: failureOutcome };
  }

  const uniqueTargets: string[] = [];
  for (const target of targets) {
    if (!uniqueTargets.includes(target)) {
      uniqueTargets.push(target);
    }
  }
  return { targets: uniqueTargets };
}
