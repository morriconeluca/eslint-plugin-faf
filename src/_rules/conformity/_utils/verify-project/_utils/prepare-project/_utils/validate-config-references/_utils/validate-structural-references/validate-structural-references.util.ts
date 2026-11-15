import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { validateStructuralSection } from './_utils/validate-structural-section/index.js';

export function validateStructuralReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const commonOutcomes = validateStructuralSection(
    undefined,
    config.faf.common?.mimeticPathStructures,
    'faf.common',
    { kind: 'common' },
    context
  );
  const localOutcomes = config.faf.locals.flatMap((local, localIndex) =>
    validateStructuralSection(
      local.horizontalHierarchies,
      local.mimeticPathStructures,
      `faf.locals[${localIndex}]`,
      { kind: 'local', localIndex },
      context
    )
  );
  return [...commonOutcomes, ...localOutcomes];
}
