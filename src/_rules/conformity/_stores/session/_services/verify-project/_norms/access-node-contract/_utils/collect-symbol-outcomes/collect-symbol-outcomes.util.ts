import type { TSymbolOutcome } from '../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { checkMasterExport } from './_utils/check-master-export/index.js';
import { indexMastersByParent } from './_utils/index-masters-by-parent/index.js';

export function collectSymbolOutcomes(
  model: TVerificationModel
): readonly TSymbolOutcome[] {
  const outcomes: TSymbolOutcome[] = [];
  const { inventory } = model.basis;
  const { graph, modules, taxonomy } = model;
  const mastersByParentId = indexMastersByParent(
    taxonomy.classifications,
    inventory.items
  );

  const accessClassifications = taxonomy.classifications.filter(
    (item) => item.nodeKind === 'access-node'
  );

  for (const classification of accessClassifications) {
    const accessItem = inventory.items[classification.itemId];
    const accessRecord = modules.records.get(classification.path);
    const hasValidScript =
      accessItem?.parentId !== null &&
      accessItem?.parentId !== undefined &&
      accessRecord?.language === 'script';

    if (!hasValidScript) {
      continue;
    }

    if (accessRecord.symbols.length > 0) {
      outcomes.push(
        createOutcome('symbol/access-node-own-symbols', {
          element: classification.path,
        })
      );
    }

    const masterClassification = mastersByParentId.get(accessItem.parentId);
    const masterRecord =
      masterClassification === undefined
        ? undefined
        : modules.records.get(masterClassification.path);

    const masterOutcome = checkMasterExport(
      classification,
      accessRecord,
      masterClassification,
      masterRecord,
      graph
    );
    if (masterOutcome !== undefined) {
      outcomes.push(masterOutcome);
    }
  }

  return outcomes;
}
