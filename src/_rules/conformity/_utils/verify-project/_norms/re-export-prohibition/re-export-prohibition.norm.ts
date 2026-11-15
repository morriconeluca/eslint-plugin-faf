import type {
  TOutcome,
  TSymbolOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import {
  collectReExportPositions,
  compareSymbolOutcomes,
} from './re-export-prohibition.util.js';

export function verifyReExportProhibition(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TSymbolOutcome[] = [];

  for (const classification of model.taxonomy.classifications) {
    const record = model.modules.records.get(classification.path);
    const isSubject =
      classification.entryKind === 'file' &&
      classification.role.kind === 'explicit' &&
      record !== undefined &&
      record.language === 'script';

    if (!isSubject) {
      continue;
    }

    const positions = collectReExportPositions(record);
    for (const position of positions) {
      outcomes.push(
        createOutcome('symbol/re-export-prohibition', {
          element: classification.path,
          position,
        })
      );
    }
  }

  outcomes.sort(compareSymbolOutcomes);
  return outcomes;
}
