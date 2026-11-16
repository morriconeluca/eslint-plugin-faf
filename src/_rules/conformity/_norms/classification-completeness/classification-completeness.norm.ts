import type { TClassificationOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';

export function verifyClassificationCompleteness(
  model: TVerificationModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];

  for (const classification of model.taxonomy.classifications) {
    if (
      classification.entryKind === 'directory' &&
      classification.domainKind === null
    ) {
      outcomes.push(
        createOutcome.classification(
          'classification/unclassifiable-directory',
          {
            element: classification.path,
          }
        )
      );
    }
    if (
      classification.entryKind === 'file' &&
      classification.nodeKind === null
    ) {
      outcomes.push(
        createOutcome.classification('classification/unclassifiable-file', {
          element: classification.path,
        })
      );
    }
  }

  outcomes.sort((left, right) => {
    const byConstraint = compareOrdinal(left.constraint, right.constraint);
    return byConstraint === 0
      ? compareOrdinal(left.element, right.element)
      : byConstraint;
  });
  return outcomes;
}
