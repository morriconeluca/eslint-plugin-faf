import type {
  TOutcome,
  TSymbolOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { collectReExportPositions } from './_utils/collect-re-export-positions/index.js';
import { compareSymbolOutcomes } from './_utils/compare-symbol-outcomes/index.js';

export function verifyReExportProhibition(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TSymbolOutcome[] = [];

  for (const item of model.taxonomy.classifications) {
    const record = model.modules.records.get(item.path);
    const isSubject =
      item.entryKind === 'file' &&
      item.role.kind === 'explicit' &&
      record !== undefined &&
      record.language === 'script';

    if (!isSubject) {
      continue;
    }

    const positions = collectReExportPositions(record);
    for (const position of positions) {
      outcomes.push(
        createOutcome('symbol/re-export-prohibition', {
          element: item.path,
          position,
        })
      );
    }
  }

  outcomes.sort(compareSymbolOutcomes);
  return outcomes;
}
