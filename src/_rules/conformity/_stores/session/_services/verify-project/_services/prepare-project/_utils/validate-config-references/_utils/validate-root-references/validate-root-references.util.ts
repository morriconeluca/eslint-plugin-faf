import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { validateLocalRoots } from './_utils/validate-local-roots/index.js';

export function validateRootReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return config.faf.locals.flatMap((local, localIndex) =>
    validateLocalRoots(local, localIndex, context)
  );
}
