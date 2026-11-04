import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { collectStringDuplicates } from '../../_validate-config-format@shared/_schemas/collect-string-duplicates/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_schemas/translate-config-issues/index.js';
import { rootFragmentsSchema } from './_schemas/root-fragments-schema/index.js';

export const validateRootFragments = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const duplicates = (
    items: unknown,
    pathAt: (index: number) => string,
    message: (value: string) => string
  ): readonly TConfigOutcome[] =>
    Array.isArray(items)
      ? collectStringDuplicates(
          items,
          new Set<string>(),
          pathAt,
          message,
          'CONFIG_4',
          'configuration/duplicate-element'
        )
      : [];

  const edgeDuplicates = (
    edges: unknown,
    edgesPath: string
  ): readonly TConfigOutcome[] => {
    if (!Array.isArray(edges)) {
      return [];
    }
    const outcomes: TConfigOutcome[] = [];
    for (const [index, edge] of edges.entries()) {
      if (!isRecord(edge)) {
        continue;
      }
      const edgePath = `${edgesPath}[${index}]`;
      outcomes.push(
        ...duplicates(
          edge['from'],
          (itemIndex) => `${edgePath}.from[${itemIndex}]`,
          (value) => `Duplicate edge element "${value}".`
        ),
        ...duplicates(
          edge['to'],
          (itemIndex) => `${edgePath}.to[${itemIndex}]`,
          (value) => `Duplicate edge element "${value}".`
        )
      );
    }
    return outcomes;
  };

  const fragmentDuplicates = (
    fragments: readonly unknown[],
    fragmentsPath: string
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    for (const [index, fragment] of fragments.entries()) {
      if (!isRecord(fragment) || !Array.isArray(fragment['rootNodes'])) {
        continue;
      }
      const fragmentPath = `${fragmentsPath}[${index}]`;
      const seen = new Set<string>();
      const rootNodes = fragment['rootNodes'];
      for (const [tierIndex, tier] of rootNodes.entries()) {
        if (!Array.isArray(tier)) {
          continue;
        }
        outcomes.push(
          ...collectStringDuplicates(
            tier,
            seen,
            (itemIndex) =>
              `${fragmentPath}.rootNodes[${tierIndex}][${itemIndex}]`,
            (value) => `Duplicate root node "${value}".`,
            'CONFIG_4',
            'configuration/duplicate-element'
          )
        );
      }
      outcomes.push(
        ...edgeDuplicates(
          fragment['dependencyEdges'],
          `${fragmentPath}.dependencyEdges`
        )
      );
      if (Array.isArray(fragment['subRootFragments'])) {
        outcomes.push(
          ...fragmentDuplicates(
            fragment['subRootFragments'],
            `${fragmentPath}.rootFragments`
          )
        );
      }
    }
    return outcomes;
  };

  return function validateRootFragments(
    rootFragments: unknown,
    basePath: string
  ): readonly TConfigOutcome[] {
    if (rootFragments === undefined) {
      return [];
    }
    const propertyPath = `${basePath}.rootFragments`;
    const parsed = rootFragmentsSchema.safeParse(rootFragments);
    const formOutcomes = parsed.success
      ? []
      : translateConfigIssues(parsed.error.issues, rootFragments, propertyPath);
    return Array.isArray(rootFragments)
      ? [...formOutcomes, ...fragmentDuplicates(rootFragments, propertyPath)]
      : formOutcomes;
  };
})();
