import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TConfigOutcome,
  TResult,
} from '../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { isPlainRecord } from '../../../../../../_session@shared/_utils/is-plain-record/index.js';
import { configFormatSchema } from './_schemas/config-format-schema/index.js';
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
import { translateConfigIssues } from './_validate-config-format@shared/_utils/translate-config-issues/index.js';
import { CONSTRAINT_SCOPE_MISMATCH } from './validate-config-format.constant.js';

export const validateConfigFormat = (() => {
  const scopeOutcome = (propertyPath: string): TConfigOutcome =>
    createOutcome(CONSTRAINT_SCOPE_MISMATCH, {
      propertyPath,
    });

  const pushShared = (
    record: Record<string, unknown>,
    basePath: string,
    outcomes: TConfigOutcome[]
  ): void => {
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
  };

  const collectCommon = (common: unknown, outcomes: TConfigOutcome[]): void => {
    if (!isPlainRecord(common)) {
      return;
    }
    for (const key of ['rootLayers', 'rootFragments']) {
      if (Object.hasOwn(common, key)) {
        outcomes.push(scopeOutcome(`faf.common.${key}`));
      }
    }
    if (common['aliases'] !== undefined) {
      outcomes.push(...validateAliases(common['aliases'], 'faf.common'));
    }
    pushShared(common, 'faf.common', outcomes);
  };

  const collectLocal = (
    local: unknown,
    localPath: string,
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
    pushShared(local, localPath, outcomes);
  };

  const collectBody = (
    raw: Record<string, unknown>,
    outcomes: TConfigOutcome[]
  ): void => {
    if (!isPlainRecord(raw['faf'])) {
      return;
    }
    const faf = raw['faf'];
    collectCommon(faf['common'], outcomes);
    const locals = faf['locals'];
    if (!Array.isArray(locals)) {
      return;
    }
    for (const [index, local] of locals.entries()) {
      collectLocal(local, `faf.locals[${index}]`, outcomes);
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
