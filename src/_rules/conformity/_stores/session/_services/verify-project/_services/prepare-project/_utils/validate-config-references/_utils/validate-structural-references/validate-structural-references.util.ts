import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { validateStructuralSection } from './_utils/validate-structural-section/index.js';

export function validateStructuralReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const commonOutcomes = validateStructuralSection(
    config.faf.common?.localHorizontalHierarchies,
    config.faf.common?.mimeticPathStructures,
    'faf.common',
    { kind: 'common' },
    context
  );
  const localOutcomes = config.faf.locals.flatMap((local, localIndex) =>
    validateStructuralSection(
      local.localHorizontalHierarchies,
      local.mimeticPathStructures,
      `faf.locals[${localIndex}]`,
      { kind: 'local', localIndex },
      context
    )
  );
  return [...commonOutcomes, ...localOutcomes];
}
