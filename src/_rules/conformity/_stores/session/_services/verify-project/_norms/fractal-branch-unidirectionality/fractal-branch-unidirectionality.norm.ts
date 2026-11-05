import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { notImplementedOutcome } from '../../_verify-project@shared/_utils/not-implemented-outcome/index.js';

export function verifyFractalBranchUnidirectionality(
  _model: TVerificationModel
): readonly TOutcome[] {
  return [notImplementedOutcome('fractal-branch-unidirectionality', '§6.6.2')];
}
