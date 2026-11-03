import type { TFAFConfig } from '../../../_domain/_types/faf-config.type.js';
import type {
  TConfigOutcome,
  TResult,
} from '../../../_domain/_types/outcome.type.js';

import { checkCatalogInvariants } from './_utils/check-catalog-invariants/index.js';
import { isFafConfig } from './_utils/is-faf-config/index.js';
import { isPlainRecord } from './_utils/is-plain-record/index.js';
import { validateAliases } from './_utils/validate-aliases/index.js';
import { validateDependencies } from './_utils/validate-dependencies/index.js';
import { validateForeignNodes } from './_utils/validate-foreign-nodes/index.js';
import { validateHierarchies } from './_utils/validate-hierarchies/index.js';
import { validateMimeticStructures } from './_utils/validate-mimetic-structures/index.js';
import { validateRoles } from './_utils/validate-roles/index.js';
import { validateRootFragments } from './_utils/validate-root-fragments/index.js';
import { validateRootLayers } from './_utils/validate-root-layers/index.js';
import { validateSubGraphRoles } from './_utils/validate-sub-graph-roles/index.js';
import {
  COMMON_ALLOWED_PROPERTIES,
  CONFIG_1,
  CONFIG_2,
  CONFIG_5,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_ORIGIN,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_SCOPE_MISMATCH,
  CONSTRAINT_UNKNOWN_PROPERTY,
  FAF_ALLOWED_PROPERTIES,
  FAF_COMMON_PREFIX,
  FAF_LOCALS_PREFIX,
  LOCALS_ALLOWED_PROPERTIES,
  ROOT_ALLOWED_PROPERTIES,
} from './validate-config-format.constant.js';

export function validateConfigFormat(raw: unknown): TResult<TFAFConfig> {
  if (raw === null) {
    return {
      ok: false,
      outcomes: [
        {
          constraint: CONSTRAINT_NULL_FORBIDDEN,
          element: '',
          family: 'configuration',
          message: 'Configuration value cannot be null.',
          normativeReference: CONFIG_1,
          propertyPath: '',
        },
      ],
    };
  }

  if (!isPlainRecord(raw)) {
    return {
      ok: false,
      outcomes: [
        {
          constraint: CONSTRAINT_INVALID_TYPE,
          element: '',
          family: 'configuration',
          message: 'Configuration value must be a plain object.',
          normativeReference: CONFIG_1,
          propertyPath: '',
        },
      ],
    };
  }

  const outcomes: TConfigOutcome[] = [];

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

  const validateCommonProperties = (common: Record<string, unknown>): void => {
    for (const [key, value] of Object.entries(common)) {
      const propertyPath = `${FAF_COMMON_PREFIX}.${key}`;
      if (key === 'rootLayers' || key === 'rootFragments') {
        addOutcome(
          propertyPath,
          CONSTRAINT_SCOPE_MISMATCH,
          CONFIG_5,
          `Property "${key}" cannot be declared in common; root origins must be declared in locals.`
        );
      } else if (!COMMON_ALLOWED_PROPERTIES.has(key)) {
        addOutcome(
          propertyPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_2,
          `Unknown property "${key}" is forbidden.`
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

  const validateCommonObject = (common: unknown): void => {
    if (common === null) {
      addOutcome(
        FAF_COMMON_PREFIX,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Property "common" cannot be null.'
      );
      return;
    }

    if (!isPlainRecord(common)) {
      addOutcome(
        FAF_COMMON_PREFIX,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "common" must be an object.'
      );
      return;
    }

    validateCommonProperties(common);

    if ('aliases' in common && common['aliases'] !== undefined) {
      validateAliases(common['aliases'], FAF_COMMON_PREFIX, outcomes);
    }

    const roleValidation = validateRoles(
      common['roles'],
      FAF_COMMON_PREFIX,
      outcomes
    );
    const subGraphValidation = validateSubGraphRoles(
      common['subGraphRoles'],
      FAF_COMMON_PREFIX,
      outcomes
    );
    checkCatalogInvariants(roleValidation, subGraphValidation, outcomes);

    validateForeignNodes(common, FAF_COMMON_PREFIX, outcomes);
    validateHierarchies(common, FAF_COMMON_PREFIX, outcomes);
    validateMimeticStructures(
      common['mimeticPathStructures'],
      FAF_COMMON_PREFIX,
      outcomes
    );
    validateDependencies(common, FAF_COMMON_PREFIX, outcomes);
  };

  const checkLocalFields = (
    local: Record<string, unknown>,
    localPath: string
  ): void => {
    for (const [key, value] of Object.entries(local)) {
      const fieldPath = `${localPath}.${key}`;
      if (key === 'aliases') {
        addOutcome(
          fieldPath,
          CONSTRAINT_SCOPE_MISMATCH,
          CONFIG_5,
          'Property "aliases" cannot be declared in locals; it must be declared exclusively in common.'
        );
      } else if (!LOCALS_ALLOWED_PROPERTIES.has(key)) {
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

  const checkOriginExclusivity = (
    hasRootLayers: boolean,
    hasRootFragments: boolean,
    areLayersEmpty: boolean,
    areFragmentsEmpty: boolean,
    localPath: string
  ): void => {
    if (hasRootLayers && hasRootFragments) {
      if (areLayersEmpty && areFragmentsEmpty) {
        addOutcome(
          localPath,
          CONSTRAINT_MISSING_ORIGIN,
          CONFIG_5,
          'Both "rootLayers" and "rootFragments" are empty; at least one non-empty origin must be provided.'
        );
      }
      return;
    }

    if (hasRootLayers && areLayersEmpty) {
      addOutcome(
        `${localPath}.rootLayers`,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_5,
        'Origin list "rootLayers" cannot be empty when it is the sole origin.'
      );
      return;
    }

    if (hasRootFragments && areFragmentsEmpty) {
      addOutcome(
        `${localPath}.rootFragments`,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_5,
        'Origin list "rootFragments" cannot be empty when it is the sole origin.'
      );
    }
  };

  const checkLocalOrigins = (
    local: Record<string, unknown>,
    localPath: string
  ): void => {
    const hasRootLayers =
      'rootLayers' in local && local['rootLayers'] !== undefined;
    const hasRootFragments =
      'rootFragments' in local && local['rootFragments'] !== undefined;

    if (!hasRootLayers && !hasRootFragments) {
      addOutcome(
        localPath,
        CONSTRAINT_MISSING_ORIGIN,
        CONFIG_5,
        'Local configuration must declare at least one origin via "rootLayers" or "rootFragments".'
      );
      return;
    }

    const areLayersEmpty =
      Array.isArray(local['rootLayers']) && local['rootLayers'].length === 0;
    const areFragmentsEmpty =
      Array.isArray(local['rootFragments']) &&
      local['rootFragments'].length === 0;
    checkOriginExclusivity(
      hasRootLayers,
      hasRootFragments,
      areLayersEmpty,
      areFragmentsEmpty,
      localPath
    );
  };

  const validateLocalItem = (local: unknown, localPath: string): void => {
    if (local === null) {
      addOutcome(
        localPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Local configuration element cannot be null.'
      );
      return;
    }

    if (!isPlainRecord(local)) {
      addOutcome(
        localPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Local configuration element must be an object.'
      );
      return;
    }

    checkLocalFields(local, localPath);
    checkLocalOrigins(local, localPath);

    validateRootLayers(local['rootLayers'], localPath, outcomes);
    validateRootFragments(local['rootFragments'], localPath, outcomes);

    const roleValidation = validateRoles(local['roles'], localPath, outcomes);
    const subGraphValidation = validateSubGraphRoles(
      local['subGraphRoles'],
      localPath,
      outcomes
    );
    checkCatalogInvariants(roleValidation, subGraphValidation, outcomes);

    validateForeignNodes(local, localPath, outcomes);
    validateHierarchies(local, localPath, outcomes);
    validateMimeticStructures(
      local['mimeticPathStructures'],
      localPath,
      outcomes
    );
    validateDependencies(local, localPath, outcomes);
  };

  const validateLocalsArray = (locals: unknown): void => {
    if (locals === null) {
      addOutcome(
        FAF_LOCALS_PREFIX,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Property "locals" cannot be null.'
      );
      return;
    }

    if (!Array.isArray(locals)) {
      addOutcome(
        FAF_LOCALS_PREFIX,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "locals" must be an array.'
      );
      return;
    }

    if (locals.length === 0) {
      addOutcome(
        FAF_LOCALS_PREFIX,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_5,
        'Property "locals" must contain at least one local configuration.'
      );
      return;
    }

    for (const [index, local] of locals.entries()) {
      validateLocalItem(local, `${FAF_LOCALS_PREFIX}[${index}]`);
    }
  };

  const validateRootRecord = (candidate: Record<string, unknown>): void => {
    for (const [key, value] of Object.entries(candidate)) {
      if (!ROOT_ALLOWED_PROPERTIES.has(key)) {
        addOutcome(
          key,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_1,
          `Unknown property "${key}" is forbidden on root configuration object.`
        );
      } else if (value === null) {
        addOutcome(
          key,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          `Property "${key}" cannot be null.`
        );
      } else {
        if (value === undefined) {
          addOutcome(
            key,
            CONSTRAINT_EXPLICIT_UNDEFINED,
            CONFIG_2,
            `Property "${key}" cannot be explicitly undefined.`
          );
        }
      }
    }
  };

  const validateFafFields = (fafRecord: Record<string, unknown>): void => {
    for (const [key, value] of Object.entries(fafRecord)) {
      const propertyPath = `faf.${key}`;
      if (!FAF_ALLOWED_PROPERTIES.has(key)) {
        addOutcome(
          propertyPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_2,
          `Unknown property "${key}" is forbidden on faf object.`
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

  const validateFafBody = (fafRecord: Record<string, unknown>): void => {
    validateFafFields(fafRecord);

    if ('locals' in fafRecord) {
      validateLocalsArray(fafRecord['locals']);
    } else {
      addOutcome(
        FAF_LOCALS_PREFIX,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_2,
        'Required property "locals" is missing.'
      );
    }

    if ('common' in fafRecord && fafRecord['common'] !== undefined) {
      validateCommonObject(fafRecord['common']);
    }
  };

  validateRootRecord(raw);

  if (!('faf' in raw)) {
    addOutcome(
      'faf',
      CONSTRAINT_MISSING_PROPERTY,
      CONFIG_1,
      'Required property "faf" is missing.'
    );
    return { ok: false, outcomes };
  }

  if (raw['faf'] === null) {
    return { ok: false, outcomes };
  }

  if (!isPlainRecord(raw['faf'])) {
    addOutcome(
      'faf',
      CONSTRAINT_INVALID_TYPE,
      CONFIG_2,
      'Property "faf" must be an object.'
    );
    return { ok: false, outcomes };
  }

  validateFafBody(raw['faf']);

  if (isFafConfig(raw, outcomes.length)) {
    return {
      ok: true,
      value: raw,
    };
  }

  return {
    ok: false,
    outcomes,
  };
}
