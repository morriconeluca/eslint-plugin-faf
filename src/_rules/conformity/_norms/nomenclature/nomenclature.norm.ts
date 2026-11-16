import type { TClassificationOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import {
  isViolatingDomainName,
  isViolatingPathFragmentOrNodeName,
  isViolatingPathSubCategoryName,
} from './nomenclature.util.js';

export function verifyNomenclature(
  model: TVerificationModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const reported = new Set<string>();

  const report = (path: string): void => {
    if (reported.has(path)) {
      return;
    }
    reported.add(path);
    outcomes.push(
      createOutcome.classification('classification/nomenclature', {
        element: path,
      })
    );
  };

  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { taxonomy } = model;

  for (const classification of taxonomy.classifications) {
    const isViolation =
      isViolatingPathSubCategoryName(classification) ||
      isViolatingDomainName(classification, inventory, trees) ||
      isViolatingPathFragmentOrNodeName(
        classification,
        taxonomy,
        inventory,
        trees
      );

    if (isViolation) {
      report(classification.path);
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
