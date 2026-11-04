import type {
  TOutcome,
  TUnverifiedOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';

export function collectGraphOutcomes(
  unverifiedOutcomes: readonly TUnverifiedOutcome[]
): readonly TOutcome[] {
  return unverifiedOutcomes;
}
