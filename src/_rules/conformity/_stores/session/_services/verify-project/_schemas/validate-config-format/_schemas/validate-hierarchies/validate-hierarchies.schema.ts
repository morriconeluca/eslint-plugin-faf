import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_7,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EMPTY_TIER,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  LOCAL_HIERARCHY_ALLOWED,
} from './validate-hierarchies.constant.js';

export function validateHierarchies(
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

  const validateTierItem = (
    item: unknown,
    itemPath: string,
    seenInHierarchy: Set<string>
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Hierarchy item cannot be null.'
      );
      return;
    }
    if (typeof item !== 'string') {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Hierarchy item must be a string.'
      );
      return;
    }
    if (item.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Hierarchy item cannot be empty.'
      );
      return;
    }

    if (seenInHierarchy.has(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_7,
        `Duplicate item "${item}" in hierarchy.`
      );
    } else {
      seenInHierarchy.add(item);
    }
  };

  const validateSingleHierarchy = (
    hierarchy: unknown,
    hierarchyPath: string
  ): void => {
    if (hierarchy === null) {
      addOutcome(
        hierarchyPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Hierarchy cannot be null.'
      );
      return;
    }
    if (!Array.isArray(hierarchy)) {
      addOutcome(
        hierarchyPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Hierarchy must be an array.'
      );
      return;
    }

    const seenInHierarchy = new Set<string>();
    for (const [tierIndex, tier] of hierarchy.entries()) {
      const tierPath = `${hierarchyPath}[${tierIndex}]`;
      if (tier === null) {
        addOutcome(
          tierPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          'Hierarchy tier cannot be null.'
        );
      } else if (!Array.isArray(tier)) {
        addOutcome(
          tierPath,
          CONSTRAINT_INVALID_TYPE,
          CONFIG_2,
          'Hierarchy tier must be an array.'
        );
      } else if (tier.length === 0) {
        addOutcome(
          tierPath,
          CONSTRAINT_EMPTY_TIER,
          CONFIG_7,
          'Hierarchy tier cannot be empty.'
        );
      } else {
        for (const [itemIndex, item] of tier.entries()) {
          validateTierItem(item, `${tierPath}[${itemIndex}]`, seenInHierarchy);
        }
      }
    }
  };

  const validateHorizontalList = (hierarchies: unknown): void => {
    const propertyPath = `${basePath}.horizontalHierarchies`;
    if (hierarchies === null) {
      addOutcome(
        propertyPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Property "horizontalHierarchies" cannot be null.'
      );
      return;
    }
    if (!Array.isArray(hierarchies)) {
      addOutcome(
        propertyPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "horizontalHierarchies" must be an array.'
      );
      return;
    }

    for (const [index, hierarchy] of hierarchies.entries()) {
      validateSingleHierarchy(hierarchy, `${propertyPath}[${index}]`);
    }
  };

  const checkLocalHierarchyProperties = (
    item: Record<string, unknown>,
    itemPath: string
  ): void => {
    for (const [key, value] of Object.entries(item)) {
      const fieldPath = `${itemPath}.${key}`;
      if (!LOCAL_HIERARCHY_ALLOWED.has(key)) {
        addOutcome(
          fieldPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_7,
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

  const validateLocalHierarchyPaths = (
    paths: unknown,
    itemPath: string
  ): void => {
    const pathsField = `${itemPath}.paths`;
    if (!Array.isArray(paths)) {
      addOutcome(
        pathsField,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "paths" must be an array.'
      );
      return;
    }
    if (paths.length === 0) {
      addOutcome(
        pathsField,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_7,
        'Property "paths" cannot be empty.'
      );
      return;
    }

    const seen = new Set<string>();
    for (const [index, pathEntry] of paths.entries()) {
      const entryPath = `${pathsField}[${index}]`;
      if (pathEntry === null) {
        addOutcome(
          entryPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          'Path element cannot be null.'
        );
      } else if (typeof pathEntry !== 'string') {
        addOutcome(
          entryPath,
          CONSTRAINT_INVALID_TYPE,
          CONFIG_2,
          'Path element must be a string.'
        );
      } else if (pathEntry.length === 0) {
        addOutcome(
          entryPath,
          CONSTRAINT_EMPTY_STRING,
          CONFIG_2,
          'Path element cannot be empty.'
        );
      } else {
        if (!isLiteralConfigPath(pathEntry)) {
          addOutcome(
            entryPath,
            CONSTRAINT_INVALID_LITERAL_PATH,
            CONFIG_2_2,
            `Invalid literal config path "${pathEntry}".`
          );
        }
        if (seen.has(pathEntry)) {
          addOutcome(
            entryPath,
            CONSTRAINT_DUPLICATE_ELEMENT,
            CONFIG_2,
            `Duplicate path "${pathEntry}".`
          );
        } else {
          seen.add(pathEntry);
        }
      }
    }
  };

  const validateLocalHierarchyItem = (
    item: unknown,
    itemPath: string
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Local hierarchy element cannot be null.'
      );
      return;
    }

    if (!isPlainRecord(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Local hierarchy element must be an object.'
      );
      return;
    }

    checkLocalHierarchyProperties(item, itemPath);

    if ('paths' in item) {
      validateLocalHierarchyPaths(item['paths'], itemPath);
    } else {
      addOutcome(
        `${itemPath}.paths`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_7,
        'Required property "paths" is missing.'
      );
    }

    if ('hierarchies' in item) {
      validateSingleHierarchy(item['hierarchies'], `${itemPath}.hierarchies`);
    } else {
      addOutcome(
        `${itemPath}.hierarchies`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_7,
        'Required property "hierarchies" is missing.'
      );
    }
  };

  const validateLocalHorizontalList = (localHierarchies: unknown): void => {
    const propertyPath = `${basePath}.localHorizontalHierarchies`;
    if (localHierarchies === null) {
      addOutcome(
        propertyPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Property "localHorizontalHierarchies" cannot be null.'
      );
      return;
    }
    if (!Array.isArray(localHierarchies)) {
      addOutcome(
        propertyPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "localHorizontalHierarchies" must be an array.'
      );
      return;
    }

    for (const [index, item] of localHierarchies.entries()) {
      validateLocalHierarchyItem(item, `${propertyPath}[${index}]`);
    }
  };

  if (
    'horizontalHierarchies' in config &&
    config['horizontalHierarchies'] !== undefined
  ) {
    validateHorizontalList(config['horizontalHierarchies']);
  }

  if (
    'localHorizontalHierarchies' in config &&
    config['localHorizontalHierarchies'] !== undefined
  ) {
    validateLocalHorizontalList(config['localHorizontalHierarchies']);
  }
}
