import type { ZodType } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_utils/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/translate-config-issues/index.js';
import { hierarchiesSchema } from './_schemas/hierarchies-schema/index.js';

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

  const subCategoryOutcomes = (
    subCategory: unknown,
    basePath: string
  ): readonly TConfigOutcome[] => {
    if (subCategory === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.subCategoryHierarchies`;
    const outcomes: TConfigOutcome[] = [
      ...parseProperty(
        hierarchiesSchema.subCategory,
        subCategory,
        propertyPath
      ),
    ];
    if (Array.isArray(subCategory)) {
      for (const [index, hierarchy] of subCategory.entries()) {
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
      ...subCategoryOutcomes(
        present(config, 'subCategoryHierarchies'),
        basePath
      ),
      ...horizontalOutcomes(present(config, 'horizontalHierarchies'), basePath),
    ];
  };
})();
