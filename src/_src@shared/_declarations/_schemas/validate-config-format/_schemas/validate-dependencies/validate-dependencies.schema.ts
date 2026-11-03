import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../../../../_domain/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_10,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  EXTERNAL_DEPENDENCY_ALLOWED,
  TREE_DEPENDENCY_ALLOWED,
} from './validate-dependencies.constant.js';

export function validateDependencies(
  config: Record<string, unknown>,
  basePath: string,
  outcomes: TConfigOutcome[]
): void {
  const isPlainRecord = (
    candidate: unknown
  ): candidate is Record<string, unknown> =>
    typeof candidate === 'object' &&
    candidate !== null &&
    !Array.isArray(candidate);

  const addOutcome = (
    targetPath: string,
    constraint: `configuration/${string}`,
    normativeReference: string,
    message: string
  ): void => {
    outcomes.push({
      constraint,
      element: targetPath,
      family: 'configuration',
      message,
      normativeReference,
      propertyPath: targetPath,
    });
  };

  const validateLiteralPathItem = (
    item: unknown,
    itemPath: string,
    seen: Set<string>
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Path element cannot be null.'
      );
      return;
    }
    if (typeof item !== 'string') {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Path element must be a string.'
      );
      return;
    }
    if (item.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Path element cannot be empty.'
      );
      return;
    }

    if (!isLiteralConfigPath(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_LITERAL_PATH,
        CONFIG_2_2,
        `Invalid literal config path "${item}".`
      );
    }

    if (seen.has(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_2,
        `Duplicate path "${item}".`
      );
    } else {
      seen.add(item);
    }
  };

  const validateLiteralPathList = (
    list: unknown,
    listPath: string,
    canBeEmpty: boolean
  ): void => {
    if (!Array.isArray(list)) {
      addOutcome(
        listPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        `Property "${listPath}" must be an array.`
      );
      return;
    }
    if (!canBeEmpty && list.length === 0) {
      addOutcome(
        listPath,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_10,
        `Property "${listPath}" cannot be empty.`
      );
      return;
    }

    const seen = new Set<string>();
    for (const [index, item] of list.entries()) {
      validateLiteralPathItem(item, `${listPath}[${index}]`, seen);
    }
  };

  const checkProperties = (
    item: Record<string, unknown>,
    allowed: ReadonlySet<string>,
    itemPath: string
  ): void => {
    for (const [key, value] of Object.entries(item)) {
      const fieldPath = `${itemPath}.${key}`;
      if (!allowed.has(key)) {
        addOutcome(
          fieldPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_10,
          `Unknown property "${key}" is forbidden.`
        );
      } else if (value === null) {
        addOutcome(
          fieldPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          `Property "${key}" cannot be null.`
        );
      } else {
        if (value === undefined) {
          addOutcome(
            fieldPath,
            CONSTRAINT_EXPLICIT_UNDEFINED,
            CONFIG_2,
            `Property "${key}" cannot be explicitly undefined.`
          );
        }
      }
    }
  };

  const validateDependencyPair = (
    pair: unknown,
    pairPath: string,
    allowed: ReadonlySet<string>
  ): void => {
    if (pair === null) {
      addOutcome(
        pairPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Dependency element cannot be null.'
      );
      return;
    }
    if (!isPlainRecord(pair)) {
      addOutcome(
        pairPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Dependency element must be an object.'
      );
      return;
    }

    checkProperties(pair, allowed, pairPath);

    if ('from' in pair) {
      validateLiteralPathList(pair['from'], `${pairPath}.from`, false);
    } else {
      addOutcome(
        `${pairPath}.from`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_10,
        'Required property "from" is missing.'
      );
    }

    if ('to' in pair) {
      validateLiteralPathList(pair['to'], `${pairPath}.to`, false);
    } else {
      addOutcome(
        `${pairPath}.to`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_10,
        'Required property "to" is missing.'
      );
    }
  };

  const validateDependencyList = (
    list: unknown,
    listPath: string,
    allowed: ReadonlySet<string>
  ): void => {
    if (!Array.isArray(list)) {
      addOutcome(
        listPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        `Property "${listPath}" must be an array.`
      );
      return;
    }

    for (const [index, pair] of list.entries()) {
      validateDependencyPair(pair, `${listPath}[${index}]`, allowed);
    }
  };

  if ('publicRootNodes' in config && config['publicRootNodes'] !== undefined) {
    validateLiteralPathList(
      config['publicRootNodes'],
      `${basePath}.publicRootNodes`,
      true
    );
  }

  if (
    'treeDependencies' in config &&
    config['treeDependencies'] !== undefined
  ) {
    validateDependencyList(
      config['treeDependencies'],
      `${basePath}.treeDependencies`,
      TREE_DEPENDENCY_ALLOWED
    );
  }

  if (
    'externalDependencies' in config &&
    config['externalDependencies'] !== undefined
  ) {
    validateDependencyList(
      config['externalDependencies'],
      `${basePath}.externalDependencies`,
      EXTERNAL_DEPENDENCY_ALLOWED
    );
  }
}
