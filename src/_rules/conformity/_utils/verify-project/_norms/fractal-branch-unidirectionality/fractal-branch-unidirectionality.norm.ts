import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { findBranchViolationPaths } from './_utils/find-branch-violation-paths/index.js';
import {
  buildBranchUnidirectionalityOutcome,
  collectBranchCandidateSources,
  compareBranchOutcomes,
  isFractalBranchUnidirectionalityViolation,
} from './fractal-branch-unidirectionality.util.js';

export function verifyFractalBranchUnidirectionality(
  model: TVerificationModel
): readonly TOutcome[] {
  const {
    basis: { inventory },
    graph,
    taxonomy,
  } = model;

  const candidateSources = collectBranchCandidateSources(
    graph,
    inventory,
    taxonomy
  );
  const violations = findBranchViolationPaths({
    candidateSources,
    graph,
    isViolation: (sourcePath, destinationPath) =>
      isFractalBranchUnidirectionalityViolation(
        sourcePath,
        destinationPath,
        inventory,
        taxonomy
      ),
  });

  const outcomes = violations.map((violation) =>
    buildBranchUnidirectionalityOutcome(violation)
  );
  outcomes.sort(compareBranchOutcomes);
  return outcomes;
}
