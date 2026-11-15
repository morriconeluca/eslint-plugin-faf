import type { TFAFConfig } from '../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TConfigOutcome,
  TResult,
} from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { THierarchyModelCheckScope } from './_utils/check-hierarchy-model-conflicts/index.js';
import type { TRolesValidationResult } from './_validate-config-format@shared/_types/validate-config-format.type.js';

import { createOutcome } from '../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { isPlainRecord } from '../../../../../../../../_src@shared/_utils/is-plain-record/index.js';
import { checkCatalogInvariants } from './_utils/check-catalog-invariants/index.js';
import { checkHierarchyModelConflicts } from './_utils/check-hierarchy-model-conflicts/index.js';
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
import { CONSTRAINT_SCOPE_MISMATCH } from './validate-config-format.constant.js';
import { configFormatSchema } from './validate-config-format.schema.js';

export function validateConfigFormat(raw: unknown): TResult<TFAFConfig> {
  type TCommonHierarchyModelsInfo = {
    readonly categoryNames: null | ReadonlySet<string>;
    readonly horizontalHierarchyModels: unknown;
  };

  const isFafConfig = (
    _candidate: unknown,
    outcomeCount: number
  ): _candidate is TFAFConfig => outcomeCount === 0;

  const extractCategoryNames = (
    roles: TRolesValidationResult
  ): ReadonlySet<string> =>
    new Set(roles.roleEntries.map((entry) => entry.category));

  const scopeOutcome = (propertyPath: string): TConfigOutcome =>
    createOutcome.configuration(CONSTRAINT_SCOPE_MISMATCH, {
      propertyPath,
    });

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
    return Object.hasOwn(record, 'roles') && record['roles'] !== undefined
      ? extractCategoryNames(roles)
      : null;
  };

  const collectCommon = (
    common: unknown,
    modelScopes: THierarchyModelCheckScope[],
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
    const horizontalHierarchyModels =
      Object.hasOwn(common, 'horizontalHierarchyModels') &&
      common['horizontalHierarchyModels'] !== undefined
        ? common['horizontalHierarchyModels']
        : null;
    if (categoryNames !== null && horizontalHierarchyModels !== null) {
      modelScopes.push({
        basePropertyPath: 'faf.common.horizontalHierarchyModels',
        categoryNames,
        models: horizontalHierarchyModels,
      });
    }
    return { categoryNames, horizontalHierarchyModels };
  };

  const collectLocal = (
    local: unknown,
    localPath: string,
    commonInfo: TCommonHierarchyModelsInfo,
    modelScopes: THierarchyModelCheckScope[],
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
    const hasLocalModels =
      Object.hasOwn(local, 'horizontalHierarchyModels') &&
      local['horizontalHierarchyModels'] !== undefined;
    const horizontalHierarchyModels = hasLocalModels
      ? local['horizontalHierarchyModels']
      : commonInfo.horizontalHierarchyModels;
    const modelsPath = hasLocalModels
      ? `${localPath}.horizontalHierarchyModels`
      : 'faf.common.horizontalHierarchyModels';
    modelScopes.push({
      basePropertyPath: modelsPath,
      categoryNames: effectiveCategories,
      models: horizontalHierarchyModels,
    });
  };

  const collectBody = (
    record: Record<string, unknown>,
    outcomes: TConfigOutcome[]
  ): void => {
    if (!isPlainRecord(record['faf'])) {
      return;
    }
    const faf = record['faf'];
    const modelScopes: THierarchyModelCheckScope[] = [];
    const commonInfo = collectCommon(faf['common'], modelScopes, outcomes);
    const locals = faf['locals'];
    if (Array.isArray(locals)) {
      for (const [index, local] of locals.entries()) {
        collectLocal(
          local,
          `faf.locals[${index}]`,
          commonInfo,
          modelScopes,
          outcomes
        );
      }
    }
    outcomes.push(...checkHierarchyModelConflicts(modelScopes));
  };

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
}
