import type {
  TFAFHorizontalHierarchy,
  TFAFMimeticPathStructure,
} from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { rejectHierarchyPaths } from './_utils/reject-hierarchy-paths/index.js';
import { rejectMimeticStructures } from './_utils/reject-mimetic-structures/index.js';

export function validateStructuralSection(
  hierarchies: readonly TFAFHorizontalHierarchy[] | undefined,
  structures: readonly TFAFMimeticPathStructure[] | undefined,
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return [
    ...rejectHierarchyPaths(
      hierarchies ?? [],
      `${basePath}.horizontalHierarchies`,
      scope,
      context
    ),
    ...rejectMimeticStructures(
      structures ?? [],
      `${basePath}.mimeticPathStructures`,
      scope,
      context
    ),
  ];
}
