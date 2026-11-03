import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type { TValidateSubpathKeyResult } from './validate-subpath-key.type.js';

import {
  CONFIG_9_REFERENCE,
  INVALID_ALIAS_SOURCE_CONSTRAINT,
  PACKAGE_JSON_ELEMENT,
  PACKAGE_JSON_IMPORTS_PROPERTY_PATH,
  UNRESOLVABLE_ALIAS_BASE_CONSTRAINT,
} from '../../../../_acquire-path-aliases@shared/_constants/acquire-path-aliases.constant.js';

export function validateSubpathKey(key: string): TValidateSubpathKeyResult {
  const createOutcome = (
    constraint:
      | 'configuration/invalid-alias-source'
      | 'configuration/unresolvable-alias-base',
    message: string
  ): TConfigOutcome => ({
    constraint,
    element: PACKAGE_JSON_ELEMENT,
    family: 'configuration',
    message,
    normativeReference: CONFIG_9_REFERENCE,
    propertyPath: `${PACKAGE_JSON_IMPORTS_PROPERTY_PATH}.${key}`,
  });

  if (key === '#' || !key.startsWith('#')) {
    return {
      outcome: createOutcome(
        INVALID_ALIAS_SOURCE_CONSTRAINT,
        `package.json imports subpath keys must start with '#' followed by a path: ${key}`
      ),
    };
  }

  const starMatches = key.match(/\*/g);
  const starCount = starMatches === null ? 0 : starMatches.length;

  if (starCount > 1) {
    return {
      outcome: createOutcome(
        UNRESOLVABLE_ALIAS_BASE_CONSTRAINT,
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
        UNRESOLVABLE_ALIAS_BASE_CONSTRAINT,
        `Wildcard in package.json imports subpath key must be terminal and preceded by a slash: ${key}`
      ),
    };
  }

  if (key.endsWith('/')) {
    return {
      outcome: createOutcome(
        INVALID_ALIAS_SOURCE_CONSTRAINT,
        `package.json imports subpath key must not end with a slash: ${key}`
      ),
    };
  }

  return {
    hasWildcardKey: false,
    prefix: key,
  };
}
