import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TCollectSubpathTargetsResult } from './collect-subpath-targets.type.js';

import { createOutcome as makeOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { importTargetNodeSchema } from './collect-subpath-targets.schema.js';

export function collectSubpathTargets(
  entryValue: unknown,
  subpathKey: string,
  hasWildcardKey: boolean
): TCollectSubpathTargetsResult {
  const INVALID_ALIAS_SOURCE = 'configuration/invalid-alias-source' as const;

  type TResolveLocalSubpathTargetResult =
    | {
        readonly outcome: TConfigOutcome;
      }
    | {
        readonly target: null | string;
      };

  const createSubpathOutcome = (
    constraint:
      | 'configuration/invalid-alias-source'
      | 'configuration/unresolvable-alias-base',
    detail: string
  ): TConfigOutcome =>
    makeOutcome(constraint, {
      detail,
      element: PACKAGE_JSON_ELEMENT,
      propertyPath: `${PACKAGE_JSON_IMPORTS_PROPERTY_PATH}.${subpathKey}`,
    });

  const extractTargetBase = (
    targetString: string
  ): TResolveLocalSubpathTargetResult => {
    if (hasWildcardKey) {
      const isSingleTerminalWildcard =
        targetString.endsWith('/*') &&
        targetString.indexOf('*') === targetString.length - 1;

      if (!isSingleTerminalWildcard) {
        return {
          outcome: createSubpathOutcome(
            'configuration/unresolvable-alias-base',
            `Local import target must contain a single terminal wildcard matching key: ${targetString}`
          ),
        };
      }
    } else if (targetString.includes('*')) {
      return {
        outcome: createSubpathOutcome(
          'configuration/unresolvable-alias-base',
          `Local import target must not contain wildcards when key has no wildcard: ${targetString}`
        ),
      };
    } else {
      const rawBase = targetString.slice(2);
      const trimmed = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
      return { target: trimmed === '' ? '.' : trimmed };
    }

    const rawBase = targetString.slice(2, -2);
    const trimmed = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    return { target: trimmed === '' ? '.' : trimmed };
  };

  const resolveLocalSubpathTarget = (
    targetString: string
  ): TResolveLocalSubpathTargetResult => {
    if (targetString.length === 0) {
      return {
        outcome: createSubpathOutcome(
          INVALID_ALIAS_SOURCE,
          `package.json imports target path cannot be empty: ${subpathKey}`
        ),
      };
    }

    if (targetString.startsWith('../') || targetString.startsWith('/')) {
      return {
        outcome: createSubpathOutcome(
          INVALID_ALIAS_SOURCE,
          `package.json imports target cannot use parent directory traversal or absolute path: ${targetString}`
        ),
      };
    }

    if (!targetString.startsWith('./')) {
      return { target: null };
    }

    return extractTargetBase(targetString);
  };

  const targets: string[] = [];

  const traverse = (currentValue: unknown): null | TConfigOutcome => {
    const parsed = importTargetNodeSchema.safeParse(currentValue);
    if (!parsed.success) {
      return createSubpathOutcome(
        INVALID_ALIAS_SOURCE,
        `Invalid package.json imports target type: ${typeof currentValue}`
      );
    }
    if (typeof parsed.data === 'string') {
      const resolution = resolveLocalSubpathTarget(parsed.data);
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
