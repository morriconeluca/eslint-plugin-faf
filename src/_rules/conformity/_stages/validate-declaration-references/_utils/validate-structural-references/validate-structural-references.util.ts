import type {
  TFAFConfig,
  TFAFHorizontalHierarchy,
  TFAFMimeticPathStructure,
} from '../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../_validate-declaration-references@shared/_utils/reject-reference-scope/index.js';

import { rejectHierarchyPaths } from './_utils/reject-hierarchy-paths/index.js';
import { rejectMimeticStructures } from './_utils/reject-mimetic-structures/index.js';

export function validateStructuralReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const validateStructuralSection = (
    hierarchies: readonly TFAFHorizontalHierarchy[] | undefined,
    structures: readonly TFAFMimeticPathStructure[] | undefined,
    basePath: string,
    scope: TScopeBinding
  ): readonly TConfigOutcome[] => [
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

  const commonOutcomes = validateStructuralSection(
    undefined,
    config.faf.common?.mimeticPathStructures,
    'faf.common',
    { kind: 'common' }
  );
  const localOutcomes = config.faf.locals.flatMap((local, localIndex) =>
    validateStructuralSection(
      local.horizontalHierarchies,
      local.mimeticPathStructures,
      `faf.locals[${localIndex}]`,
      { kind: 'local', localIndex }
    )
  );
  return [...commonOutcomes, ...localOutcomes];
}
