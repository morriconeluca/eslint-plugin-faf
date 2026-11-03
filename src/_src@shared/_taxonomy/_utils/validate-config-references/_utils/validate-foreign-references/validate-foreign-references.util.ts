import type { TFAFConfig } from '../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { validateForeignSection } from './_utils/validate-foreign-section/index.js';

export function validateForeignReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const commonOutcomes = validateForeignSection(
    config.faf.common?.foreignDomains,
    config.faf.common?.foreignNodes,
    'faf.common',
    { kind: 'common' },
    context
  );
  const localOutcomes = config.faf.locals.flatMap((local, localIndex) =>
    validateForeignSection(
      local.foreignDomains,
      local.foreignNodes,
      `faf.locals[${localIndex}]`,
      { kind: 'local', localIndex },
      context
    )
  );
  return [...commonOutcomes, ...localOutcomes];
}
