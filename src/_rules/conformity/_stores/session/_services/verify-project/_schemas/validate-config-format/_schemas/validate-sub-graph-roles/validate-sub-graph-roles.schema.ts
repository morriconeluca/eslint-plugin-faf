import type { TConfigOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TSubGraphRoleEntry } from '../../_validate-config-format@shared/_types/validate-config-format.type.js';

import {
  CONFIG_2,
  CONFIG_3,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  SUB_GRAPH_ROLE_ALLOWED_PROPERTIES,
} from './validate-sub-graph-roles.constant.js';

export function validateSubGraphRoles(
  subGraphRoles: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): readonly TSubGraphRoleEntry[] {
  if (subGraphRoles === undefined) {
    return [];
  }

  const subGraphPath = `${basePath}.subGraphRoles`;
  if (subGraphRoles === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: subGraphPath,
      family: 'configuration',
      message: 'Property "subGraphRoles" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath: subGraphPath,
    });
    return [];
  }

  if (!Array.isArray(subGraphRoles)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: subGraphPath,
      family: 'configuration',
      message: 'Property "subGraphRoles" must be an array.',
      normativeReference: CONFIG_2,
      propertyPath: subGraphPath,
    });
    return [];
  }

  const subGraphEntries: TSubGraphRoleEntry[] = [];

  const isPlainRecord = (
    candidate: unknown
  ): candidate is Record<string, unknown> =>
    typeof candidate === 'object' &&
    candidate !== null &&
    !Array.isArray(candidate);

  const addOutcome = (
    propertyPath: string,
    constraint: `configuration/${string}`,
    normativeReference: string,
    message: string
  ): void => {
    outcomes.push({
      constraint,
      element: propertyPath,
      family: 'configuration',
      message,
      normativeReference,
      propertyPath,
    });
  };

  const checkItemProperties = (
    itemRecord: Record<string, unknown>,
    itemPath: string
  ): void => {
    for (const [key, value] of Object.entries(itemRecord)) {
      const propertyPath = `${itemPath}.${key}`;
      if (!SUB_GRAPH_ROLE_ALLOWED_PROPERTIES.has(key)) {
        addOutcome(
          propertyPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_3,
          `Unknown property "${key}" is forbidden on sub-graph role.`
        );
      } else if (value === null) {
        addOutcome(
          propertyPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          `Property "${key}" cannot be null.`
        );
      } else {
        if (value === undefined) {
          addOutcome(
            propertyPath,
            CONSTRAINT_EXPLICIT_UNDEFINED,
            CONFIG_2,
            `Property "${key}" cannot be explicitly undefined.`
          );
        }
      }
    }
  };

  const validateSubGraphItem = (item: unknown, itemPath: string): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Sub-graph role cannot be null.'
      );
      return;
    }

    if (!isPlainRecord(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Sub-graph role must be an object.'
      );
      return;
    }

    checkItemProperties(item, itemPath);

    if (!('name' in item)) {
      addOutcome(
        `${itemPath}.name`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_3,
        'Required property "name" is missing.'
      );
      return;
    }

    if (item['name'] === null || item['name'] === undefined) {
      return;
    }

    if (typeof item['name'] !== 'string') {
      addOutcome(
        `${itemPath}.name`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "name" must be a string.'
      );
      return;
    }

    if (item['name'].length === 0) {
      addOutcome(
        `${itemPath}.name`,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Property "name" cannot be empty.'
      );
      return;
    }

    subGraphEntries.push({ name: item['name'], path: itemPath });
  };

  for (const [index, item] of subGraphRoles.entries()) {
    validateSubGraphItem(item, `${subGraphPath}[${index}]`);
  }

  return subGraphEntries;
}
