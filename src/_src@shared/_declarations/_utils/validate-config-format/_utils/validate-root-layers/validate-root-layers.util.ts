import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';

import { isLiteralConfigPath } from '../../../../../_domain/_utils/is-literal-config-path/index.js';
import {
  CONFIG_2,
  CONFIG_2_2,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_INVALID_LITERAL_PATH,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_NULL_FORBIDDEN,
} from './validate-root-layers.constant.js';

export function validateRootLayers(
  rootLayers: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): void {
  if (rootLayers === undefined) {
    return;
  }

  const propertyPath = `${basePath}.rootLayers`;

  if (rootLayers === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "rootLayers" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

  if (!Array.isArray(rootLayers)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: propertyPath,
      family: 'configuration',
      message: 'Property "rootLayers" must be an array.',
      normativeReference: CONFIG_2,
      propertyPath,
    });
    return;
  }

  const seen = new Set<string>();

  const validateItem = (item: unknown, itemPath: string): void => {
    if (item === null) {
      outcomes.push({
        constraint: CONSTRAINT_NULL_FORBIDDEN,
        element: itemPath,
        family: 'configuration',
        message: 'Root layer element cannot be null.',
        normativeReference: CONFIG_2,
        propertyPath: itemPath,
      });
      return;
    }

    if (typeof item !== 'string') {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_TYPE,
        element: itemPath,
        family: 'configuration',
        message: 'Root layer element must be a string.',
        normativeReference: CONFIG_2,
        propertyPath: itemPath,
      });
      return;
    }

    if (item.length === 0) {
      outcomes.push({
        constraint: CONSTRAINT_EMPTY_STRING,
        element: itemPath,
        family: 'configuration',
        message: 'Root layer element cannot be empty.',
        normativeReference: CONFIG_2,
        propertyPath: itemPath,
      });
      return;
    }

    if (!isLiteralConfigPath(item)) {
      outcomes.push({
        constraint: CONSTRAINT_INVALID_LITERAL_PATH,
        element: itemPath,
        family: 'configuration',
        message: `Invalid literal config path "${item}".`,
        normativeReference: CONFIG_2_2,
        propertyPath: itemPath,
      });
    }

    if (seen.has(item)) {
      outcomes.push({
        constraint: CONSTRAINT_DUPLICATE_ELEMENT,
        element: itemPath,
        family: 'configuration',
        message: `Duplicate root layer "${item}".`,
        normativeReference: CONFIG_2,
        propertyPath: itemPath,
      });
    } else {
      seen.add(item);
    }
  };

  for (const [index, item] of rootLayers.entries()) {
    validateItem(item, `${propertyPath}[${index}]`);
  }
}
