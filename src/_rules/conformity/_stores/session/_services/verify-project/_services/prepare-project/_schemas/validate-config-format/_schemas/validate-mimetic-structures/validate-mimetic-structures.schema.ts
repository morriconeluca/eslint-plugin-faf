import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import { isKebabCase } from './_utils/is-kebab-case/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_8,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_DUPLICATE_MIMETIC_PATH,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_ACTION_NAME,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  MIMETIC_STRUCTURE_ALLOWED,
} from './validate-mimetic-structures.constant.js';

export function validateMimeticStructures(
  mimeticStructures: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): void {
  if (mimeticStructures === undefined) {
    return;
  }

  const propertyPath = `${basePath}.mimeticPathStructures`;

  if (mimeticStructures === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "mimeticPathStructures" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

  if (!Array.isArray(mimeticStructures)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "mimeticPathStructures" must be an array.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

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

  const checkProperties = (
    item: Record<string, unknown>,
    itemPath: string
  ): void => {
    for (const [key, value] of Object.entries(item)) {
      const fieldPath = `${itemPath}.${key}`;
      if (!MIMETIC_STRUCTURE_ALLOWED.has(key)) {
        addOutcome(
          fieldPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_8,
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

  const seenAcrossStructures = new Map<string, string>();

  const validatePathItem = (
    pathEntry: unknown,
    entryPath: string,
    seenWithinStructure: Set<string>
  ): void => {
    if (pathEntry === null) {
      addOutcome(
        entryPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Path element cannot be null.'
      );
      return;
    }
    if (typeof pathEntry !== 'string') {
      addOutcome(
        entryPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Path element must be a string.'
      );
      return;
    }
    if (pathEntry.length === 0) {
      addOutcome(
        entryPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Path element cannot be empty.'
      );
      return;
    }

    if (!isLiteralConfigPath(pathEntry)) {
      addOutcome(
        entryPath,
        CONSTRAINT_INVALID_LITERAL_PATH,
        CONFIG_2_2,
        `Invalid literal config path "${pathEntry}".`
      );
    }

    if (seenWithinStructure.has(pathEntry)) {
      addOutcome(
        entryPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_2,
        `Duplicate path "${pathEntry}".`
      );
    } else {
      seenWithinStructure.add(pathEntry);
    }

    if (seenAcrossStructures.has(pathEntry)) {
      addOutcome(
        entryPath,
        CONSTRAINT_DUPLICATE_MIMETIC_PATH,
        CONFIG_8,
        `Path "${pathEntry}" is declared in multiple mimetic path structures.`
      );
    } else {
      seenAcrossStructures.set(pathEntry, entryPath);
    }
  };

  const validatePathsList = (paths: unknown, itemPath: string): void => {
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
        CONFIG_8,
        'Property "paths" cannot be empty.'
      );
      return;
    }

    const seenWithinStructure = new Set<string>();
    for (const [index, pathEntry] of paths.entries()) {
      validatePathItem(
        pathEntry,
        `${pathsField}[${index}]`,
        seenWithinStructure
      );
    }
  };

  const validateActionItem = (
    action: unknown,
    actionPath: string,
    seenActions: Set<string>
  ): void => {
    if (action === null) {
      addOutcome(
        actionPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Action element cannot be null.'
      );
      return;
    }
    if (typeof action !== 'string') {
      addOutcome(
        actionPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Action element must be a string.'
      );
      return;
    }
    if (action.length === 0) {
      addOutcome(
        actionPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Action element cannot be empty.'
      );
      return;
    }

    if (!isKebabCase(action)) {
      addOutcome(
        actionPath,
        CONSTRAINT_INVALID_ACTION_NAME,
        CONFIG_8,
        `Action "${action}" must be in kebab-case.`
      );
    }

    if (seenActions.has(action)) {
      addOutcome(
        actionPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_8,
        `Duplicate action "${action}".`
      );
    } else {
      seenActions.add(action);
    }
  };

  const validateActionsList = (actions: unknown, itemPath: string): void => {
    const actionsField = `${itemPath}.actions`;
    if (!Array.isArray(actions)) {
      addOutcome(
        actionsField,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "actions" must be an array.'
      );
      return;
    }
    if (actions.length === 0) {
      addOutcome(
        actionsField,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_8,
        'Property "actions" cannot be empty when present.'
      );
      return;
    }

    const seenActions = new Set<string>();
    for (const [index, action] of actions.entries()) {
      validateActionItem(action, `${actionsField}[${index}]`, seenActions);
    }
  };

  const validateItem = (item: unknown, itemPath: string): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Mimetic path structure element cannot be null.'
      );
      return;
    }
    if (!isPlainRecord(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Mimetic path structure element must be an object.'
      );
      return;
    }

    checkProperties(item, itemPath);

    if ('paths' in item) {
      validatePathsList(item['paths'], itemPath);
    } else {
      addOutcome(
        `${itemPath}.paths`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_8,
        'Required property "paths" is missing.'
      );
    }

    if ('actions' in item && item['actions'] !== undefined) {
      validateActionsList(item['actions'], itemPath);
    }
  };

  for (const [index, item] of mimeticStructures.entries()) {
    validateItem(item, `${propertyPath}[${index}]`);
  }
}
