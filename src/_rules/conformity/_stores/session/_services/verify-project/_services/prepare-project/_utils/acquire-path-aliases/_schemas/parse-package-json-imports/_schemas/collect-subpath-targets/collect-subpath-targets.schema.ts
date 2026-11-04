import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TCollectSubpathTargetsResult } from './collect-subpath-targets.type.js';

import {
  CONFIG_9_REFERENCE,
  INVALID_ALIAS_SOURCE_CONSTRAINT,
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { resolveLocalSubpathTarget } from './_utils/resolve-local-subpath-target/index.js';

export function collectSubpathTargets(
  entryValue: unknown,
  subpathKey: string,
  hasWildcardKey: boolean
): TCollectSubpathTargetsResult {
  const targets: string[] = [];

  const traverse = (currentValue: unknown): null | TConfigOutcome => {
    if (currentValue === null) {
      return null;
    }

    if (typeof currentValue === 'string') {
      const resolution = resolveLocalSubpathTarget(
        currentValue,
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

    if (typeof currentValue === 'object') {
      const children = Array.isArray(currentValue)
        ? currentValue
        : Object.values(currentValue);

      for (const item of children) {
        const outcome = traverse(item);
        if (outcome !== null) {
          return outcome;
        }
      }
      return null;
    }

    return {
      constraint: INVALID_ALIAS_SOURCE_CONSTRAINT,
      element: PACKAGE_JSON_ELEMENT,
      family: 'configuration',
      message: `Invalid package.json imports target type: ${typeof currentValue}`,
      normativeReference: CONFIG_9_REFERENCE,
      propertyPath: `${PACKAGE_JSON_IMPORTS_PROPERTY_PATH}.${subpathKey}`,
    };
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
