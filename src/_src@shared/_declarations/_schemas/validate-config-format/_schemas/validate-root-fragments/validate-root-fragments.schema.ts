import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../../../../_domain/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONFIG_4,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EMPTY_TIER,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_FILE_NAME,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  ROOT_EDGE_ALLOWED,
  ROOT_FRAGMENT_ALLOWED,
} from './validate-root-fragments.constant.js';

export function validateRootFragments(
  rootFragments: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): void {
  if (rootFragments === undefined) {
    return;
  }

  const propertyPath = `${basePath}.rootFragments`;

  if (rootFragments === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "rootFragments" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

  if (!Array.isArray(rootFragments)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "rootFragments" must be an array.',
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
    record: Record<string, unknown>,
    allowed: ReadonlySet<string>,
    recordPath: string
  ): void => {
    for (const [key, value] of Object.entries(record)) {
      const fieldPath = `${recordPath}.${key}`;
      if (!allowed.has(key)) {
        addOutcome(
          fieldPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_2,
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

  const validatePathField = (
    frag: Record<string, unknown>,
    fragPath: string
  ): void => {
    if (!('path' in frag)) {
      addOutcome(
        `${fragPath}.path`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_2,
        'Required property "path" is missing.'
      );
      return;
    }
    if (typeof frag['path'] !== 'string') {
      addOutcome(
        `${fragPath}.path`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "path" must be a string.'
      );
      return;
    }
    if (frag['path'].length === 0) {
      addOutcome(
        `${fragPath}.path`,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Property "path" cannot be empty.'
      );
      return;
    }
    if (!isLiteralConfigPath(frag['path'])) {
      addOutcome(
        `${fragPath}.path`,
        CONSTRAINT_INVALID_LITERAL_PATH,
        CONFIG_2_2,
        `Invalid literal config path "${frag['path']}".`
      );
    }
  };

  const validateRootNodeItem = (
    item: unknown,
    itemPath: string,
    seenInRootNodes: Set<string>
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Root node element cannot be null.'
      );
      return;
    }
    if (typeof item !== 'string') {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Root node element must be a string.'
      );
      return;
    }
    if (item.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Root node element cannot be empty.'
      );
      return;
    }

    if (item.includes('/') || !isLiteralConfigPath(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_FILE_NAME,
        CONFIG_4,
        `Root node file name "${item}" must be a direct child without "/".`
      );
    }

    if (seenInRootNodes.has(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_4,
        `Duplicate root node "${item}".`
      );
    } else {
      seenInRootNodes.add(item);
    }
  };

  const validateRootNodes = (
    frag: Record<string, unknown>,
    fragPath: string
  ): void => {
    if (!('rootNodes' in frag)) {
      addOutcome(
        `${fragPath}.rootNodes`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_2,
        'Required property "rootNodes" is missing.'
      );
      return;
    }

    if (!Array.isArray(frag['rootNodes'])) {
      addOutcome(
        `${fragPath}.rootNodes`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "rootNodes" must be an array.'
      );
      return;
    }

    const rootNodes = frag['rootNodes'];
    const seenInRootNodes = new Set<string>();
    for (const [tierIndex, tier] of rootNodes.entries()) {
      const tierPath = `${fragPath}.rootNodes[${tierIndex}]`;
      if (tier === null) {
        addOutcome(
          tierPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          'Root nodes tier cannot be null.'
        );
      } else if (!Array.isArray(tier)) {
        addOutcome(
          tierPath,
          CONSTRAINT_INVALID_TYPE,
          CONFIG_2,
          'Root nodes tier must be an array.'
        );
      } else if (tier.length === 0) {
        addOutcome(
          tierPath,
          CONSTRAINT_EMPTY_TIER,
          CONFIG_4,
          'Root nodes tier cannot be empty.'
        );
      } else {
        for (const [itemIndex, item] of tier.entries()) {
          validateRootNodeItem(
            item,
            `${tierPath}[${itemIndex}]`,
            seenInRootNodes
          );
        }
      }
    }
  };

  const validateEdgeItem = (
    item: unknown,
    itemPath: string,
    isFileName: boolean,
    seen: Set<string>
  ): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Edge target cannot be null.'
      );
      return;
    }
    if (typeof item !== 'string') {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Edge target must be a string.'
      );
      return;
    }
    if (item.length === 0) {
      addOutcome(
        itemPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Edge target cannot be empty.'
      );
      return;
    }

    if (isFileName) {
      if (item.includes('/') || !isLiteralConfigPath(item)) {
        addOutcome(
          itemPath,
          CONSTRAINT_INVALID_FILE_NAME,
          CONFIG_4,
          `File name "${item}" cannot contain "/".`
        );
      }
    } else {
      if (!isLiteralConfigPath(item)) {
        addOutcome(
          itemPath,
          CONSTRAINT_INVALID_LITERAL_PATH,
          CONFIG_2_2,
          `Invalid literal config path "${item}".`
        );
      }
    }

    if (seen.has(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_4,
        `Duplicate edge element "${item}".`
      );
    } else {
      seen.add(item);
    }
  };

  const validateEdgeList = (
    list: unknown,
    listPath: string,
    isFileName: boolean
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
    if (list.length === 0) {
      addOutcome(
        listPath,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_4,
        `Property "${listPath}" cannot be empty.`
      );
      return;
    }

    const seen = new Set<string>();
    for (const [index, item] of list.entries()) {
      validateEdgeItem(item, `${listPath}[${index}]`, isFileName, seen);
    }
  };

  const validateSingleEdge = (
    edgeRecord: Record<string, unknown>,
    edgePath: string
  ): void => {
    checkProperties(edgeRecord, ROOT_EDGE_ALLOWED, edgePath);

    if ('from' in edgeRecord) {
      validateEdgeList(edgeRecord['from'], `${edgePath}.from`, true);
    } else {
      addOutcome(
        `${edgePath}.from`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_4,
        'Required property "from" is missing.'
      );
    }

    if ('to' in edgeRecord) {
      validateEdgeList(edgeRecord['to'], `${edgePath}.to`, false);
    } else {
      addOutcome(
        `${edgePath}.to`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_4,
        'Required property "to" is missing.'
      );
    }
  };

  const validateDependencyEdges = (edges: unknown, fragPath: string): void => {
    const edgesPath = `${fragPath}.dependencyEdges`;
    if (!Array.isArray(edges)) {
      addOutcome(
        edgesPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "dependencyEdges" must be an array.'
      );
      return;
    }

    for (const [index, edge] of edges.entries()) {
      const edgePath = `${edgesPath}[${index}]`;
      if (edge === null) {
        addOutcome(
          edgePath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          'Dependency edge cannot be null.'
        );
      } else if (isPlainRecord(edge)) {
        validateSingleEdge(edge, edgePath);
      } else {
        addOutcome(
          edgePath,
          CONSTRAINT_INVALID_TYPE,
          CONFIG_2,
          'Dependency edge must be an object.'
        );
      }
    }
  };

  const validateFragmentItem = (item: unknown, itemPath: string): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Root fragment element cannot be null.'
      );
      return;
    }

    if (!isPlainRecord(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Root fragment element must be an object.'
      );
      return;
    }

    checkProperties(item, ROOT_FRAGMENT_ALLOWED, itemPath);
    validatePathField(item, itemPath);
    validateRootNodes(item, itemPath);

    if ('subRootFragments' in item && item['subRootFragments'] !== undefined) {
      validateRootFragments(item['subRootFragments'], itemPath, outcomes);
    }

    if ('dependencyEdges' in item && item['dependencyEdges'] !== undefined) {
      validateDependencyEdges(item['dependencyEdges'], itemPath);
    }
  };

  for (const [index, item] of rootFragments.entries()) {
    validateFragmentItem(item, `${propertyPath}[${index}]`);
  }
}
