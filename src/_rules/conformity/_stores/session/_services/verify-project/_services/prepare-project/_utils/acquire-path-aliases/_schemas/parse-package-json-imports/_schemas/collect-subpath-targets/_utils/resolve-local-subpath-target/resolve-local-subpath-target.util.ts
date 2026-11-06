import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TResolveLocalSubpathTargetResult } from './resolve-local-subpath-target.type.js';

import { createOutcome as makeOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';
import { cleanBasePath } from './_utils/clean-base-path/index.js';

export function resolveLocalSubpathTarget(
  targetString: string,
  subpathKey: string,
  hasWildcardKey: boolean
): TResolveLocalSubpathTargetResult {
  const createOutcome = (
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

  if (targetString.length === 0) {
    return {
      outcome: createOutcome(
        'configuration/invalid-alias-source',
        `package.json imports target path cannot be empty: ${subpathKey}`
      ),
    };
  }

  if (targetString.startsWith('../') || targetString.startsWith('/')) {
    return {
      outcome: createOutcome(
        'configuration/invalid-alias-source',
        `package.json imports target cannot use parent directory traversal or absolute path: ${targetString}`
      ),
    };
  }

  if (!targetString.startsWith('./')) {
    return { target: null };
  }

  if (hasWildcardKey) {
    const isSingleTerminalWildcard =
      targetString.endsWith('/*') &&
      targetString.indexOf('*') === targetString.length - 1;

    if (!isSingleTerminalWildcard) {
      return {
        outcome: createOutcome(
          'configuration/unresolvable-alias-base',
          `Local import target must contain a single terminal wildcard matching key: ${targetString}`
        ),
      };
    }

    return { target: cleanBasePath(targetString.slice(2, -2)) };
  }

  if (targetString.includes('*')) {
    return {
      outcome: createOutcome(
        'configuration/unresolvable-alias-base',
        `Local import target must not contain wildcards when key has no wildcard: ${targetString}`
      ),
    };
  }

  return { target: cleanBasePath(targetString.slice(2)) };
}
