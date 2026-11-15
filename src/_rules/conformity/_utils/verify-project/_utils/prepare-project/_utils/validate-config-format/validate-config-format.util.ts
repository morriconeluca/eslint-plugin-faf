import type { TFAFConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TConfigOutcome,
  TResult,
} from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TRolesValidationResult } from './_validate-config-format@shared/_types/validate-config-format.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { isPlainRecord } from '../../../../../../../../_src@shared/_utils/is-plain-record/index.js';
import { checkCatalogInvariants } from './_utils/check-catalog-invariants/index.js';
import { isFafConfig } from './_utils/is-faf-config/index.js';
import { validateAliases } from './_utils/validate-aliases/index.js';
import { validateDependencies } from './_utils/validate-dependencies/index.js';
import { validateForeignNodes } from './_utils/validate-foreign-nodes/index.js';
import { validateHierarchies } from './_utils/validate-hierarchies/index.js';
import { validateMimeticStructures } from './_utils/validate-mimetic-structures/index.js';
import { validateRoles } from './_utils/validate-roles/index.js';
import { validateRootFragments } from './_utils/validate-root-fragments/index.js';
import { validateRootLayers } from './_utils/validate-root-layers/index.js';
import { validateSubGraphRoles } from './_utils/validate-sub-graph-roles/index.js';
import { translateConfigIssues } from './_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';
import {
  CONSTRAINT_MODEL_CATEGORY_CONFLICT,
  CONSTRAINT_SCOPE_MISMATCH,
} from './validate-config-format.constant.js';
import { configFormatSchema } from './validate-config-format.schema.js';

export const validateConfigFormat = (() => {
  type TCommonHierarchyModelsInfo = {
    readonly categoryNames: null | ReadonlySet<string>;
    readonly horizontalHierarchyModels: unknown;
  };

  const hasDefined = (record: Record<string, unknown>, key: string): boolean =>
    Object.hasOwn(record, key) && record[key] !== undefined;

  const extractCategoryNames = (
    roles: TRolesValidationResult
  ): ReadonlySet<string> =>
    new Set(roles.roleEntries.map((entry) => entry.category));

  const scopeOutcome = (propertyPath: string): TConfigOutcome =>
    createOutcome(CONSTRAINT_SCOPE_MISMATCH, {
      propertyPath,
    });

  const collectTierConflicts = (
    tier: readonly unknown[],
    tierPath: string,
    categoryNames: ReadonlySet<string>,
    seenPaths: Set<string>,
    outcomes: TConfigOutcome[]
  ): void => {
    for (const [memberIndex, member] of tier.entries()) {
      const propertyPath = `${tierPath}[${memberIndex}]`;
      if (
        typeof member !== 'string' ||
        !categoryNames.has(member) ||
        seenPaths.has(propertyPath)
      ) {
        continue;
      }
      seenPaths.add(propertyPath);
      outcomes.push(
        createOutcome(CONSTRAINT_MODEL_CATEGORY_CONFLICT, {
          detail: `Sub-Category "${member}" matches Category "${member}" in the role catalog.`,
          propertyPath,
        })
      );
    }
  };

  const collectHierarchyConflicts = (
    hierarchy: readonly unknown[],
    hierarchyPath: string,
    categoryNames: ReadonlySet<string>,
    seenPaths: Set<string>,
    outcomes: TConfigOutcome[]
  ): void => {
    for (const [tierIndex, tier] of hierarchy.entries()) {
      if (Array.isArray(tier)) {
        collectTierConflicts(
          tier,
          `${hierarchyPath}[${tierIndex}]`,
          categoryNames,
          seenPaths,
          outcomes
        );
      }
    }
  };

  const collectModelCategoryConflicts = (
    models: unknown,
    categoryNames: ReadonlySet<string>,
    basePropertyPath: string,
    seenPaths: Set<string>,
    outcomes: TConfigOutcome[]
  ): void => {
    if (!Array.isArray(models) || categoryNames.size === 0) {
      return;
    }
    for (const [modelIndex, model] of models.entries()) {
      if (Array.isArray(model)) {
        collectHierarchyConflicts(
          model,
          `${basePropertyPath}[${modelIndex}]`,
          categoryNames,
          seenPaths,
          outcomes
        );
      }
    }
  };

  const pushShared = (
    record: Record<string, unknown>,
    basePath: string,
    outcomes: TConfigOutcome[]
  ): null | ReadonlySet<string> => {
    const roles = validateRoles(record['roles'], basePath);
    const subGraphs = validateSubGraphRoles(record['subGraphRoles'], basePath);
    outcomes.push(
      ...roles.outcomes,
      ...subGraphs.outcomes,
      ...checkCatalogInvariants(roles, subGraphs.entries),
      ...validateForeignNodes(record, basePath),
      ...validateHierarchies(record, basePath),
      ...validateDependencies(record, basePath),
      ...validateMimeticStructures(record['mimeticPathStructures'], basePath)
    );
    return hasDefined(record, 'roles') ? extractCategoryNames(roles) : null;
  };

  const collectCommon = (
    common: unknown,
    seenConflictPaths: Set<string>,
    outcomes: TConfigOutcome[]
  ): TCommonHierarchyModelsInfo => {
    if (!isPlainRecord(common)) {
      return { categoryNames: null, horizontalHierarchyModels: null };
    }
    for (const key of [
      'horizontalHierarchies',
      'rootLayers',
      'rootFragments',
    ]) {
      if (Object.hasOwn(common, key)) {
        outcomes.push(scopeOutcome(`faf.common.${key}`));
      }
    }
    if (common['aliases'] !== undefined) {
      outcomes.push(...validateAliases(common['aliases'], 'faf.common'));
    }
    const categoryNames = pushShared(common, 'faf.common', outcomes);
    const horizontalHierarchyModels = hasDefined(
      common,
      'horizontalHierarchyModels'
    )
      ? common['horizontalHierarchyModels']
      : null;
    if (categoryNames !== null && horizontalHierarchyModels !== null) {
      collectModelCategoryConflicts(
        horizontalHierarchyModels,
        categoryNames,
        'faf.common.horizontalHierarchyModels',
        seenConflictPaths,
        outcomes
      );
    }
    return { categoryNames, horizontalHierarchyModels };
  };

  const collectLocal = (
    local: unknown,
    localPath: string,
    commonInfo: TCommonHierarchyModelsInfo,
    seenConflictPaths: Set<string>,
    outcomes: TConfigOutcome[]
  ): void => {
    if (!isPlainRecord(local)) {
      return;
    }
    if ('aliases' in local) {
      outcomes.push(scopeOutcome(`${localPath}.aliases`));
    }
    outcomes.push(
      ...validateRootLayers(local['rootLayers'], localPath),
      ...validateRootFragments(local['rootFragments'], localPath)
    );
    const localCategories = pushShared(local, localPath, outcomes);
    const effectiveCategories = localCategories ?? commonInfo.categoryNames;
    if (effectiveCategories === null) {
      return;
    }
    const hasLocalModels = hasDefined(local, 'horizontalHierarchyModels');
    const horizontalHierarchyModels = hasLocalModels
      ? local['horizontalHierarchyModels']
      : commonInfo.horizontalHierarchyModels;
    const modelsPath = hasLocalModels
      ? `${localPath}.horizontalHierarchyModels`
      : 'faf.common.horizontalHierarchyModels';
    collectModelCategoryConflicts(
      horizontalHierarchyModels,
      effectiveCategories,
      modelsPath,
      seenConflictPaths,
      outcomes
    );
  };

  const collectBody = (
    raw: Record<string, unknown>,
    outcomes: TConfigOutcome[]
  ): void => {
    if (!isPlainRecord(raw['faf'])) {
      return;
    }
    const faf = raw['faf'];
    const seenConflictPaths = new Set<string>();
    const commonInfo = collectCommon(
      faf['common'],
      seenConflictPaths,
      outcomes
    );
    const locals = faf['locals'];
    if (!Array.isArray(locals)) {
      return;
    }
    for (const [index, local] of locals.entries()) {
      collectLocal(
        local,
        `faf.locals[${index}]`,
        commonInfo,
        seenConflictPaths,
        outcomes
      );
    }
  };

  return function validateConfigFormat(raw: unknown): TResult<TFAFConfig> {
    const shaped = configFormatSchema.safeParse(raw);
    const outcomes: TConfigOutcome[] = shaped.success
      ? []
      : [...translateConfigIssues(shaped.error.issues, raw, '')];
    if (isPlainRecord(raw)) {
      collectBody(raw, outcomes);
    }
    return shaped.success && outcomes.length === 0 && isFafConfig(raw, 0)
      ? { ok: true, value: raw }
      : { ok: false, outcomes };
  };
})();
