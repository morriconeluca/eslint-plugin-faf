import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../../../../_domain/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_9,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_INVALID_ALIAS_KEY,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_NULL_FORBIDDEN,
} from './validate-aliases.constant.js';

export function validateAliases(
  aliases: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): void {
  const validateAliasKey = (
    key: string,
    keyPath: string,
    targetPath: string
  ): void => {
    if (key.length === 0) {
      outcomes.push({
        constraint: CONSTRAINT_EMPTY_STRING,
        element: targetPath,
        family: 'configuration',
        message: 'Alias key cannot be empty.',
        normativeReference: CONFIG_9,
        propertyPath: targetPath,
      });
    }

    if (key.endsWith('/')) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_ALIAS_KEY,
        element: keyPath,
        family: 'configuration',
        message: `Alias key "${key}" cannot have a trailing slash.`,
        normativeReference: CONFIG_9,
        propertyPath: keyPath,
      });
    }

    if (key.includes('*')) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_ALIAS_KEY,
        element: keyPath,
        family: 'configuration',
        message: `Alias key "${key}" cannot contain wildcard characters.`,
        normativeReference: CONFIG_9,
        propertyPath: keyPath,
      });
    }
  };

  const validateAliasTarget = (
    key: string,
    value: unknown,
    keyPath: string
  ): void => {
    if (value === null) {
      outcomes.push({
        constraint: CONSTRAINT_NULL_FORBIDDEN,
        element: keyPath,
        family: 'configuration',
        message: 'Alias target cannot be null.',
        normativeReference: CONFIG_2,
        propertyPath: keyPath,
      });
      return;
    }

    if (typeof value !== 'string') {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_TYPE,
        element: keyPath,
        family: 'configuration',
        message: `Alias target for "${key}" must be a string path.`,
        normativeReference: CONFIG_9,
        propertyPath: keyPath,
      });
      return;
    }

    if (value.length === 0) {
      outcomes.push({
        constraint: CONSTRAINT_EMPTY_STRING,
        element: keyPath,
        family: 'configuration',
        message: 'Alias target cannot be empty.',
        normativeReference: CONFIG_9,
        propertyPath: keyPath,
      });
      return;
    }

    if (!isLiteralConfigPath(value)) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_LITERAL_PATH,
        element: keyPath,
        family: 'configuration',
        message: `Invalid literal config path "${value}".`,
        normativeReference: CONFIG_2_2,
        propertyPath: keyPath,
      });
    }
  };

  const propertyPath = `${basePath}.aliases`;

  if (aliases === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "aliases" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

  if (typeof aliases !== 'object' || Array.isArray(aliases)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: propertyPath,
      family: 'configuration',
      message:
        'Property "aliases" must be a map of string prefixes to path strings.',
      normativeReference: CONFIG_9,
      propertyPath,
    });
    return;
  }

  for (const [key, value] of Object.entries(aliases)) {
    const keyPath = `${propertyPath}.${key}`;
    validateAliasKey(key, keyPath, propertyPath);
    validateAliasTarget(key, value, keyPath);
  }
}
