import type { TClassificationOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import {
  CLASSIFICATION_FAMILY,
  CONSTRAINT_UNCLASSIFIABLE_DIRECTORY,
  CONSTRAINT_UNCLASSIFIABLE_FILE,
  NORMATIVE_REFERENCE,
} from './classification-completeness.constant.js';

export function verifyClassificationCompleteness(
  model: TVerificationModel
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];

  for (const classification of model.taxonomy.classifications) {
    if (
      classification.entryKind === 'directory' &&
      classification.domainKind === null
    ) {
      outcomes.push({
        constraint: CONSTRAINT_UNCLASSIFIABLE_DIRECTORY,
        element: classification.path,
        family: CLASSIFICATION_FAMILY,
        message: `Directory '${classification.path}' has no unique Logical Domain classification.`,
        normativeReference: NORMATIVE_REFERENCE,
      });
    }
    if (
      classification.entryKind === 'file' &&
      classification.nodeKind === null
    ) {
      outcomes.push({
        constraint: CONSTRAINT_UNCLASSIFIABLE_FILE,
        element: classification.path,
        family: CLASSIFICATION_FAMILY,
        message: `File '${classification.path}' is neither a uniquely classified Logical Node nor a Foreign Node.`,
        normativeReference: NORMATIVE_REFERENCE,
      });
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
