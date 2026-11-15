import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { validateLocalRoots } from './_utils/validate-local-roots/index.js';

export function validateRootReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  return config.faf.locals.flatMap((local, localIndex) =>
    validateLocalRoots(local, localIndex, context)
  );
}
