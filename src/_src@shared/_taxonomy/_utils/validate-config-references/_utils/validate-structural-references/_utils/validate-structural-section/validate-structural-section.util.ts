import type {
  TFAFLocalHorizontalHierarchy,
  TFAFMimeticPathStructure,
} from '../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { rejectHierarchyPaths } from './_utils/reject-hierarchy-paths/index.js';
import { rejectMimeticStructures } from './_utils/reject-mimetic-structures/index.js';

export function validateStructuralSection(
  hierarchies: readonly TFAFLocalHorizontalHierarchy[] | undefined,
  structures: readonly TFAFMimeticPathStructure[] | undefined,
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return [
    ...rejectHierarchyPaths(
      hierarchies ?? [],
      `${basePath}.localHorizontalHierarchies`,
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
