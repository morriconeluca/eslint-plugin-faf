import type { ZodType } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_schemas/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_schemas/translate-config-issues/index.js';
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
          (item) => `Duplicate item "${item}" in hierarchy.`,
          'CONFIG_7',
          'configuration/duplicate-element'
        )
      );
    }
    return outcomes;
  };

  const pathDuplicates = (
    paths: unknown,
    pathsPath: string
  ): readonly TConfigOutcome[] =>
    Array.isArray(paths)
      ? collectStringDuplicates(
          paths,
          new Set<string>(),
          (index) => `${pathsPath}[${index}]`,
          (item) => `Duplicate path "${item}".`,
          'CONFIG_2',
          'configuration/duplicate-element'
        )
      : [];

  const present = (record: Record<string, unknown>, key: string): unknown =>
    Object.hasOwn(record, key) && record[key] !== undefined
      ? record[key]
      : undefined;

  const localOutcomes = (
    local: unknown,
    basePath: string
  ): readonly TConfigOutcome[] => {
    if (local === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.localHorizontalHierarchies`;
    const outcomes: TConfigOutcome[] = [
      ...parseProperty(hierarchiesSchema.local, local, propertyPath),
    ];
    if (!Array.isArray(local)) {
      return outcomes;
    }
    for (const [index, item] of local.entries()) {
      if (!isRecord(item)) {
        continue;
      }

      const itemPath = `${propertyPath}[${index}]`;
      outcomes.push(
        ...pathDuplicates(item['paths'], `${itemPath}.paths`),
        ...hierarchyDuplicates(item['hierarchies'], `${itemPath}.hierarchies`)
      );
    }
    return outcomes;
  };

  return function validateHierarchies(
    config: Record<string, unknown>,
    basePath: string
  ): readonly TConfigOutcome[] {
    const outcomes: TConfigOutcome[] = [];
    const horizontal = present(config, 'horizontalHierarchies');
    if (horizontal !== undefined) {
      const propertyPath = `${basePath}.horizontalHierarchies`;
      outcomes.push(
        ...parseProperty(hierarchiesSchema.horizontal, horizontal, propertyPath)
      );
      if (Array.isArray(horizontal)) {
        for (const [index, hierarchy] of horizontal.entries()) {
          outcomes.push(
            ...hierarchyDuplicates(hierarchy, `${propertyPath}[${index}]`)
          );
        }
      }
    }
    outcomes.push(
      ...localOutcomes(present(config, 'localHorizontalHierarchies'), basePath)
    );
    return outcomes;
  };
})();
