import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { compileForeignPattern } from '../../../../../../_verify-project@shared/_utils/compile-foreign-pattern/index.js';
import { isLiteralConfigPath } from '../../_validate-config-format@shared/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_6,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_FOREIGN_PATTERN,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  FOREIGN_FAMILY_ALLOWED,
} from './validate-foreign-nodes.constant.js';

export function validateForeignNodes(
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
        CONFIG_6,
        `Property "${listPath}" cannot be empty.`
      );
      return;
    }

    const seen = new Set<string>();
    for (const [index, item] of list.entries()) {
      validateLiteralPathItem(item, `${listPath}[${index}]`, seen);
    }
  };

  const validateForeignDomains = (domains: unknown): void => {
    const domainsPath = `${basePath}.foreignDomains`;
    validateLiteralPathList(domains, domainsPath, true);
  };

  const checkFamilyProperties = (
    family: Record<string, unknown>,
    familyPath: string
  ): void => {
    for (const [key, value] of Object.entries(family)) {
      const fieldPath = `${familyPath}.${key}`;
      if (!FOREIGN_FAMILY_ALLOWED.has(key)) {
        addOutcome(
          fieldPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_6,
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

  const validatePatternItem = (
    pattern: unknown,
    itemPath: string,
    seenPatterns: Set<string>
  ): void => {
    if (pattern === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Pattern element cannot be null.'
      );
      return;
    }
    if (typeof pattern !== 'string') {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Pattern element must be a string.'
      );
      return;
    }
    if (pattern.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Pattern element cannot be empty.'
      );
      return;
    }

    const result = compileForeignPattern(pattern);
    if (!result.ok) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_FOREIGN_PATTERN,
        CONFIG_6,
        `Invalid foreign pattern "${pattern}": ${result.reason}.`
      );
    }

    if (seenPatterns.has(pattern)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_2,
        `Duplicate pattern "${pattern}".`
      );
    } else {
      seenPatterns.add(pattern);
    }
  };

  const validatePatternsList = (
    patterns: unknown,
    familyPath: string
  ): void => {
    const patternsPath = `${familyPath}.patterns`;
    if (!Array.isArray(patterns)) {
      addOutcome(
        patternsPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "patterns" must be an array.'
      );
      return;
    }
    if (patterns.length === 0) {
      addOutcome(
        patternsPath,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_6,
        'Property "patterns" cannot be empty.'
      );
      return;
    }

    const seenPatterns = new Set<string>();
    for (const [index, pattern] of patterns.entries()) {
      validatePatternItem(pattern, `${patternsPath}[${index}]`, seenPatterns);
    }
  };

  const validateFamilyObject = (
    family: Record<string, unknown>,
    familyPath: string
  ): void => {
    checkFamilyProperties(family, familyPath);

    if ('paths' in family) {
      validateLiteralPathList(family['paths'], `${familyPath}.paths`, false);
    } else {
      addOutcome(
        `${familyPath}.paths`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_6,
        'Required property "paths" is missing.'
      );
    }

    if ('patterns' in family) {
      validatePatternsList(family['patterns'], familyPath);
    } else {
      addOutcome(
        `${familyPath}.patterns`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_6,
        'Required property "patterns" is missing.'
      );
    }
  };

  const validateForeignStringNode = (
    item: string,
    itemPath: string,
    seenStrings: Set<string>
  ): void => {
    if (item.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Foreign node path cannot be empty.'
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

    if (seenStrings.has(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_2,
        `Duplicate foreign node path "${item}".`
      );
    } else {
      seenStrings.add(item);
    }
  };

  const validateForeignNodeItem = (
    item: unknown,
    itemPath: string,
    seenStrings: Set<string>
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Foreign node element cannot be null.'
      );
      return;
    }

    if (typeof item === 'string') {
      validateForeignStringNode(item, itemPath, seenStrings);
      return;
    }

    if (isPlainRecord(item)) {
      validateFamilyObject(item, itemPath);
      return;
    }

    addOutcome(
      itemPath,
      CONSTRAINT_INVALID_TYPE,
      CONFIG_2,
      'Foreign node element must be a string or a family object.'
    );
  };

  const validateForeignNodesList = (nodes: unknown): void => {
    const nodesPath = `${basePath}.foreignNodes`;
    if (!Array.isArray(nodes)) {
      addOutcome(
        nodesPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "foreignNodes" must be an array.'
      );
      return;
    }

    const seenStrings = new Set<string>();
    for (const [index, item] of nodes.entries()) {
      validateForeignNodeItem(item, `${nodesPath}[${index}]`, seenStrings);
    }
  };

  if ('foreignDomains' in config && config['foreignDomains'] !== undefined) {
    validateForeignDomains(config['foreignDomains']);
  }

  if ('foreignNodes' in config && config['foreignNodes'] !== undefined) {
    validateForeignNodesList(config['foreignNodes']);
  }
}
