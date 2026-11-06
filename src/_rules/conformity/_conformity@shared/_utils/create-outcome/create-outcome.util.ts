import type {
  TAcyclicityConstraint,
  TAcyclicityOutcome,
  TClassificationConstraint,
  TClassificationOutcome,
  TConfigConstraint,
  TConfigFacts,
  TConfigOutcome,
  TConstraint,
  TCycleFacts,
  TDependencyOutcome,
  TEdgeFacts,
  TEdgeOnlyDependencyConstraint,
  TEdgeOrPathDependencyConstraint,
  TElementFacts,
  TOutcome,
  TOutcomeFacts,
  TOutcomeFactsFor,
  TOutcomeFor,
  TPathFacts,
  TPathOnlyDependencyConstraint,
  TSymbolConstraint,
  TSymbolFacts,
  TSymbolOutcome,
  TUnverifiedConstraint,
  TUnverifiedFacts,
  TUnverifiedOutcome,
} from '../../_types/outcome.type.js';

import { OUTCOME_CATALOG } from '../../_configs/outcome-catalog.config.js';
import { buildOutcomeRecord } from './_utils/build-outcome-record/index.js';
import { formatOutcomeMessage } from './_utils/format-outcome-message/index.js';

export function createOutcome(
  code: TAcyclicityConstraint,
  facts: TCycleFacts
): TAcyclicityOutcome;
export function createOutcome(
  code: TClassificationConstraint,
  facts: TElementFacts
): TClassificationOutcome;
export function createOutcome(
  code: TConfigConstraint,
  facts: TConfigFacts
): TConfigOutcome;
export function createOutcome(
  code: TPathOnlyDependencyConstraint,
  facts: TPathFacts
): TDependencyOutcome;
export function createOutcome(
  code: TEdgeOrPathDependencyConstraint,
  facts: TEdgeFacts | TPathFacts
): TDependencyOutcome;
export function createOutcome(
  code: TEdgeOnlyDependencyConstraint,
  facts: TEdgeFacts
): TDependencyOutcome;
export function createOutcome(
  code: TSymbolConstraint,
  facts: TSymbolFacts
): TSymbolOutcome;
export function createOutcome(
  code: TUnverifiedConstraint,
  facts: TUnverifiedFacts
): TUnverifiedOutcome;
export function createOutcome<K extends TConstraint>(
  code: K,
  facts: TOutcomeFactsFor<K>
): TOutcomeFor<K>;
export function createOutcome(
  code: TConstraint,
  facts: TOutcomeFacts
): TOutcome {
  const entry = OUTCOME_CATALOG[code];
  const message = formatOutcomeMessage(entry.predicate, facts);
  return buildOutcomeRecord(code, entry, message, facts);
}
