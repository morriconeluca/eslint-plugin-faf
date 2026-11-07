import type { TClassificationOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { isViolatingFragmentsForm } from './_utils/is-violating-fragments-form/index.js';
import { isViolatingNodeForm } from './_utils/is-violating-node-form/index.js';

export function verifyCategoryRole(
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
      createOutcome('classification/category-role', { element: path })
    );
  };

  const { inventory } = model.basis;
  const { trees } = model.basis.declarations;
  const { taxonomy } = model;

  for (const classification of taxonomy.classifications) {
    const isViolation =
      isViolatingNodeForm(classification, taxonomy, inventory, trees) ||
      isViolatingFragmentsForm(classification, taxonomy, inventory, trees);

    if (isViolation) {
      report(classification.path);
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
