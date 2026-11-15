import type {
  TDependencyOutcome,
  TOutcome,
} from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/verification-model.type.js';

import { findReEntryPaths } from './_utils/find-re-entry-paths/index.js';
import {
  buildReEntryOutcome,
  buildReEntryTransitions,
  collectTreeCandidateSources,
  compareReEntryOutcomes,
  getTreeOrigin,
} from './re-entry-prohibition.util.js';

export function verifyReEntryProhibition(
  model: TVerificationModel
): readonly TOutcome[] {
  const { inventory } = model.basis;
  const transitionsBySource = buildReEntryTransitions(model);
  const outcomes: TDependencyOutcome[] = [];

  for (const tree of model.basis.declarations.trees) {
    const treeOrigin = tree.originPath;
    const candidateSources = collectTreeCandidateSources(
      treeOrigin,
      transitionsBySource,
      inventory
    );
    const matches = findReEntryPaths({
      candidateSources,
      isTargetTree: (path: string) =>
        getTreeOrigin(path, inventory) === treeOrigin,
      transitionsBySource,
    });
    for (const match of matches) {
      outcomes.push(buildReEntryOutcome(match));
    }
  }

  outcomes.sort(compareReEntryOutcomes);
  return outcomes;
}
