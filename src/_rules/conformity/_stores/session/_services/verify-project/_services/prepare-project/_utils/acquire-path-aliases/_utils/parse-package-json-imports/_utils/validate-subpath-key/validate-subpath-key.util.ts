import type { TConfigOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TValidateSubpathKeyResult } from './validate-subpath-key.type.js';

import { createOutcome as makeOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
} from '../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';

export function validateSubpathKey(key: string): TValidateSubpathKeyResult {
  const createOutcome = (
    constraint:
      | 'configuration/invalid-alias-key'
      | 'configuration/invalid-alias-source'
      | 'configuration/unresolvable-alias-base',
    detail: string
  ): TConfigOutcome =>
    makeOutcome(constraint, {
      detail,
      element: PACKAGE_JSON_ELEMENT,
      propertyPath: `${PACKAGE_JSON_IMPORTS_PROPERTY_PATH}.${key}`,
    });

  if (key === '#' || !key.startsWith('#')) {
    return {
      outcome: createOutcome(
        'configuration/invalid-alias-source',
        `package.json imports subpath keys must start with '#' followed by a path: ${key}`
      ),
    };
  }

  const starMatches = key.match(/\*/g);
  const starCount = starMatches === null ? 0 : starMatches.length;

  if (starCount > 1) {
    return {
      outcome: createOutcome(
        'configuration/unresolvable-alias-base',
        `package.json imports subpath key cannot contain multiple wildcards: ${key}`
      ),
    };
  }

  if (starCount === 1) {
    if (key.endsWith('/*')) {
      return {
        hasWildcardKey: true,
        prefix: key.slice(0, -2),
      };
    }

    return {
      outcome: createOutcome(
        'configuration/unresolvable-alias-base',
        `Wildcard in package.json imports subpath key must be terminal and preceded by a slash: ${key}`
      ),
    };
  }

  if (key.endsWith('/')) {
    return {
      outcome: createOutcome(
        'configuration/invalid-alias-source',
        `package.json imports subpath key must not end with a slash: ${key}`
      ),
    };
  }

  return {
    hasWildcardKey: false,
    prefix: key,
  };
}
