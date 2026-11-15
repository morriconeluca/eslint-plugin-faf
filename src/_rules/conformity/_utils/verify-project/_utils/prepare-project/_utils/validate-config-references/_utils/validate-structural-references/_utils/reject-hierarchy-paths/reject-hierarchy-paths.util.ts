import type { TFAFHorizontalHierarchy } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { assertInvariant } from '../../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { referenceScope } from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

export const rejectHierarchyPaths = (() => {
  function validateHierarchyMembers(
    entry: TFAFHorizontalHierarchy,
    entryPath: string,
    context: TReferenceContext
  ): readonly TConfigOutcome[] {
    const parentId = context.inventory.pathToId.get(entry.path);
    assertInvariant(
      parentId !== undefined,
      `Hierarchy parent "${entry.path}" must exist in inventory.`
    );
    return entry.hierarchy.flatMap((tier, tierIndex) =>
      tier.flatMap((member, memberIndex) => {
        const childPath =
          entry.path === '.' ? member : `${entry.path}/${member}`;
        const isDirectSegment = !member.includes('/') && !member.includes('\\');
        const childId = isDirectSegment
          ? context.inventory.pathToId.get(childPath)
          : undefined;
        const childItem =
          childId === undefined ? undefined : context.inventory.items[childId];
        if (childItem !== undefined && childItem.parentId === parentId) {
          return [];
        }
        return [
          createOutcome('configuration/non-existent-path', {
            detail: `Direct child "${member}" does not exist under "${entry.path}".`,
            element: childPath,
            propertyPath: `${entryPath}.hierarchy[${tierIndex}][${memberIndex}]`,
          }),
        ];
      })
    );
  }

  return function rejectHierarchyPaths(
    hierarchies: readonly TFAFHorizontalHierarchy[],
    basePath: string,
    scope: TScopeBinding,
    context: TReferenceContext
  ): readonly TConfigOutcome[] {
    return hierarchies.flatMap((entry, entryIndex) => {
      const entryPath = `${basePath}[${entryIndex}]`;
      const parentOutcomes = referenceScope.rejectDirectoryInScope({
        context,
        label: 'Hierarchy directory',
        path: entry.path,
        propertyPath: `${entryPath}.path`,
        scope,
      });
      return parentOutcomes.length > 0
        ? parentOutcomes
        : validateHierarchyMembers(entry, entryPath, context);
    });
  };
})();
