import type { ZodType } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_utils/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/config-diagnostic-codec/index.js';
import { hierarchiesSchema } from './validate-hierarchies.schema.js';

export const validateHierarchies = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const parseProperty = (
    schema: ZodType,
    value: unknown,
    propertyPath: string
  ): readonly TConfigOutcome[] => {
    const parsed = schema.safeParse(value);
    return parsed.success
      ? []
      : translateConfigIssues(parsed.error.issues, value, propertyPath);
  };

  const hierarchyDuplicates = (
    hierarchy: unknown,
    hierarchyPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(hierarchy)) {
      return [];
    }
    const seen = new Set<string>();
    const outcomes: TConfigOutcome[] = [];
    for (const [tierIndex, tier] of hierarchy.entries()) {
      if (!Array.isArray(tier)) {
        continue;
      }
      outcomes.push(
        ...collectStringDuplicates(
          tier,
          seen,
          (index) => `${hierarchyPath}[${tierIndex}][${index}]`,
          'configuration/duplicate-element'
        )
      );
    }
    return outcomes;
  };

  const present = (record: Record<string, unknown>, key: string): unknown =>
    Object.hasOwn(record, key) && record[key] !== undefined
      ? record[key]
      : undefined;

  const modelOutcomes = (
    models: unknown,
    basePath: string
  ): readonly TConfigOutcome[] => {
    if (models === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.horizontalHierarchyModels`;
    const outcomes: TConfigOutcome[] = [
      ...parseProperty(hierarchiesSchema.models, models, propertyPath),
    ];
    if (Array.isArray(models)) {
      for (const [index, hierarchy] of models.entries()) {
        outcomes.push(
          ...hierarchyDuplicates(hierarchy, `${propertyPath}[${index}]`)
        );
      }
    }
    return outcomes;
  };

  const horizontalOutcomes = (
    horizontal: unknown,
    basePath: string
  ): readonly TConfigOutcome[] => {
    if (horizontal === undefined || basePath === 'faf.common') {
      return [];
    }
    const propertyPath = `${basePath}.horizontalHierarchies`;
    const outcomes: TConfigOutcome[] = [
      ...parseProperty(hierarchiesSchema.horizontal, horizontal, propertyPath),
    ];
    if (!Array.isArray(horizontal)) {
      return outcomes;
    }
    for (const [index, item] of horizontal.entries()) {
      if (!isRecord(item)) {
        continue;
      }
      outcomes.push(
        ...hierarchyDuplicates(
          item['hierarchy'],
          `${propertyPath}[${index}].hierarchy`
        )
      );
    }
    return outcomes;
  };

  return function validateHierarchies(
    config: Record<string, unknown>,
    basePath: string
  ): readonly TConfigOutcome[] {
    return [
      ...modelOutcomes(present(config, 'horizontalHierarchyModels'), basePath),
      ...horizontalOutcomes(present(config, 'horizontalHierarchies'), basePath),
    ];
  };
})();
