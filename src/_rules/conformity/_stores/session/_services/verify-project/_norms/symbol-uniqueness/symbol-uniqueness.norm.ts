import type {
  TOutcome,
  TSymbolOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isViolatingMasterSymbol } from './_utils/is-violating-master-symbol/index.js';
import { isViolatingSymbolUniqueness } from './_utils/is-violating-symbol-uniqueness/index.js';

export function verifySymbolUniqueness(
  model: TVerificationModel
): readonly TOutcome[] {
  const outcomes: TSymbolOutcome[] = [];
  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { records } = model.modules;
  const { classifications } = model.taxonomy;

  const treeByOrigin = new Map(trees.map((tree) => [tree.originPath, tree]));

  for (const classification of classifications) {
    const item = inventory.items[classification.itemId];
    const treeOrigin = item?.treeOrigin;
    const tree =
      typeof treeOrigin === 'string' ? treeByOrigin.get(treeOrigin) : undefined;
    const record = records.get(classification.path);

    if (
      tree === undefined ||
      record === undefined ||
      record.language !== 'script'
    ) {
      continue;
    }

    if (isViolatingMasterSymbol(classification, record)) {
      outcomes.push(
        createOutcome('symbol/master-symbol', {
          element: classification.path,
        })
      );
    }

    if (isViolatingSymbolUniqueness(classification, record, tree)) {
      outcomes.push(
        createOutcome('symbol/symbol-uniqueness', {
          element: classification.path,
        })
      );
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
