import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { THierarchyModelCheckScope } from './check-hierarchy-model-conflicts.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { CONSTRAINT_MODEL_CATEGORY_CONFLICT } from './check-hierarchy-model-conflicts.constant.js';

export function checkHierarchyModelConflicts(
  scopes: readonly THierarchyModelCheckScope[]
): readonly TConfigOutcome[] {
  type TRawMember =
    | bigint
    | boolean
    | null
    | number
    | object
    | string
    | symbol
    | undefined;

  const isRawArray = (value: unknown): value is readonly TRawMember[] =>
    Array.isArray(value);

  const seenPaths = new Set<string>();
  const outcomes: TConfigOutcome[] = [];

  const collectTierConflicts = (
    tier: readonly TRawMember[],
    tierPath: string,
    categoryNames: ReadonlySet<string>
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
        createOutcome.configuration(CONSTRAINT_MODEL_CATEGORY_CONFLICT, {
          detail: `Sub-Category "${member}" matches Category "${member}" in the role catalog.`,
          propertyPath,
        })
      );
    }
  };

  const collectHierarchyConflicts = (
    hierarchy: readonly TRawMember[],
    hierarchyPath: string,
    categoryNames: ReadonlySet<string>
  ): void => {
    for (const [tierIndex, tier] of hierarchy.entries()) {
      if (isRawArray(tier)) {
        collectTierConflicts(
          tier,
          `${hierarchyPath}[${tierIndex}]`,
          categoryNames
        );
      }
    }
  };

  for (const scope of scopes) {
    if (!isRawArray(scope.models) || scope.categoryNames.size === 0) {
      continue;
    }
    for (const [modelIndex, model] of scope.models.entries()) {
      if (isRawArray(model)) {
        collectHierarchyConflicts(
          model,
          `${scope.basePropertyPath}[${modelIndex}]`,
          scope.categoryNames
        );
      }
    }
  }

  return outcomes;
}
