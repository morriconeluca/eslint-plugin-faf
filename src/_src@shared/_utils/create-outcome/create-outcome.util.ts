import type {
  TAcyclicityConstraint,
  TCatalogEntry,
  TClassificationConstraint,
  TConfigConstraint,
  TConfigFacts,
  TConstraint,
  TCycleFacts,
  TDependencyConstraint,
  TEdgeFacts,
  TEdgeOnlyDependencyConstraint,
  TEdgeOrPathDependencyConstraint,
  TElementFacts,
  TFormatFacts,
  TOutcome,
  TOutcomeFacts,
  TOutcomeFactsFor,
  TOutcomeFor,
  TPathFacts,
  TPathOnlyDependencyConstraint,
  TSourceLocation,
  TSymbolConstraint,
  TSymbolFacts,
  TUnverifiedConstraint,
  TUnverifiedFacts,
} from './create-outcome.type.js';

import { OUTCOME_CATALOG } from './create-outcome.config.js';

export function createOutcome(
  code: TAcyclicityConstraint,
  facts: TCycleFacts
): TOutcomeFor<TAcyclicityConstraint>;
export function createOutcome(
  code: TClassificationConstraint,
  facts: TElementFacts
): TOutcomeFor<TClassificationConstraint>;
export function createOutcome(
  code: TConfigConstraint,
  facts: TConfigFacts
): TOutcomeFor<TConfigConstraint>;
export function createOutcome(
  code: TPathOnlyDependencyConstraint,
  facts: TPathFacts
): TOutcomeFor<TPathOnlyDependencyConstraint>;
export function createOutcome(
  code: TEdgeOrPathDependencyConstraint,
  facts: TEdgeFacts | TPathFacts
): TOutcomeFor<TEdgeOrPathDependencyConstraint>;
export function createOutcome(
  code: TEdgeOnlyDependencyConstraint,
  facts: TEdgeFacts
): TOutcomeFor<TEdgeOnlyDependencyConstraint>;
export function createOutcome(
  code: TSymbolConstraint,
  facts: TSymbolFacts
): TOutcomeFor<TSymbolConstraint>;
export function createOutcome(
  code: TUnverifiedConstraint,
  facts: TUnverifiedFacts
): TOutcomeFor<TUnverifiedConstraint>;
export function createOutcome<K extends TConstraint>(
  code: K,
  facts: TOutcomeFactsFor<K>
): TOutcomeFor<K>;
export function createOutcome(
  code: TConstraint,
  facts: TOutcomeFacts
): TOutcome {
  type TPositionSpread =
    | Record<string, never>
    | { readonly position: TSourceLocation };

  const isAcyclicity = (
    constraint: TConstraint
  ): constraint is TAcyclicityConstraint =>
    constraint.startsWith('acyclicity/');
  const isClassification = (
    constraint: TConstraint
  ): constraint is TClassificationConstraint =>
    constraint.startsWith('classification/');
  const isConfig = (constraint: TConstraint): constraint is TConfigConstraint =>
    constraint.startsWith('configuration/');
  const isDependency = (
    constraint: TConstraint
  ): constraint is TDependencyConstraint =>
    constraint.startsWith('dependency/');
  const isSymbol = (constraint: TConstraint): constraint is TSymbolConstraint =>
    constraint.startsWith('symbol/');
  const isUnverified = (
    constraint: TConstraint
  ): constraint is TUnverifiedConstraint =>
    constraint.startsWith('unverified/');

  const isCycleFacts = (
    candidateFacts: TOutcomeFacts
  ): candidateFacts is TCycleFacts => 'cycle' in candidateFacts;
  const isConfigFacts = (
    candidateFacts: TOutcomeFacts
  ): candidateFacts is TConfigFacts => 'propertyPath' in candidateFacts;
  const isDependencyFacts = (
    candidateFacts: TOutcomeFacts
  ): candidateFacts is TEdgeFacts | TPathFacts => 'from' in candidateFacts;
  const isUnverifiedFacts = (
    candidateFacts: TOutcomeFacts
  ): candidateFacts is TUnverifiedFacts => 'reason' in candidateFacts;
  const hasElement = (
    candidateFacts: TOutcomeFacts
  ): candidateFacts is TElementFacts | TSymbolFacts =>
    'element' in candidateFacts && typeof candidateFacts.element === 'string';

  const formatOutcomeMessage = (
    predicate: string,
    formatFacts: TFormatFacts
  ): string => {
    if (formatFacts.cycle !== undefined) {
      const segments = formatFacts.cycle
        .map((segment) => segment.join(' -> '))
        .join('; ');
      return `'${formatFacts.element}' ${predicate}: ${segments}`;
    }
    if (formatFacts.chain !== undefined) {
      const chainText = formatFacts.chain.join(' -> ');
      return `'${formatFacts.from}' reaches '${formatFacts.to}' through ${chainText}: ${predicate}`;
    }
    if (formatFacts.specifier !== undefined) {
      return `'${formatFacts.from}' imports '${formatFacts.to}' through '${formatFacts.specifier}': ${predicate}`;
    }
    const element = formatFacts.element ?? formatFacts.propertyPath;
    if (
      formatFacts.detail !== undefined &&
      formatFacts.detail !== null &&
      formatFacts.detail !== ''
    ) {
      const cleaned = formatFacts.detail.replace(/\.$/, '');
      return `'${element}' ${predicate}: ${cleaned}`;
    }
    return `'${element}' ${predicate}`;
  };

  const buildCoreOutcome = (
    entry: TCatalogEntry,
    message: string,
    positionSpread: TPositionSpread
  ): TOutcome | undefined => {
    if (isAcyclicity(code) && isCycleFacts(facts)) {
      return {
        ...positionSpread,
        constraint: code,
        cycle: facts.cycle,
        element: facts.element,
        family: 'acyclicity',
        message,
        normativeReference: entry.normativeReference,
      };
    }
    if (isClassification(code) && hasElement(facts)) {
      return {
        ...positionSpread,
        constraint: code,
        element: facts.element,
        family: 'classification',
        message,
        normativeReference: entry.normativeReference,
      };
    }
    if (isConfig(code) && isConfigFacts(facts)) {
      return {
        ...positionSpread,
        constraint: code,
        element: facts.element ?? facts.propertyPath,
        family: 'configuration',
        message,
        normativeReference: entry.normativeReference,
        propertyPath: facts.propertyPath,
      };
    }
    return undefined;
  };

  const buildDependencyOutcome = (
    entry: TCatalogEntry,
    message: string,
    positionSpread: TPositionSpread
  ): TOutcome | undefined => {
    if (isDependency(code) && isDependencyFacts(facts)) {
      return {
        ...('chain' in facts && { chain: facts.chain }),
        ...positionSpread,
        ...('specifier' in facts && { specifier: facts.specifier }),
        constraint: code,
        element: facts.element ?? facts.from,
        family: 'dependency',
        from: facts.from,
        importIndex: facts.importIndex,
        message,
        normativeReference: entry.normativeReference,
        to: facts.to,
      };
    }
    return undefined;
  };

  const buildSymbolOrUnverified = (
    entry: TCatalogEntry,
    message: string,
    positionSpread: TPositionSpread
  ): TOutcome => {
    if (isSymbol(code) && hasElement(facts)) {
      return {
        ...('symbolCount' in facts && { symbolCount: facts.symbolCount }),
        ...('symbolName' in facts && { symbolName: facts.symbolName }),
        ...positionSpread,
        constraint: code,
        element: facts.element,
        family: 'symbol',
        message,
        normativeReference: entry.normativeReference,
      };
    }
    return {
      ...positionSpread,
      constraint: isUnverified(code) ? code : 'unverified/unsupported-syntax',
      element: hasElement(facts) ? facts.element : '',
      family: 'unverified',
      message,
      normativeReference: entry.normativeReference,
      reason: isUnverifiedFacts(facts) ? facts.reason : 'unsupported-syntax',
    };
  };

  const entry = OUTCOME_CATALOG[code];
  const message = formatOutcomeMessage(entry.predicate, facts);
  const positionSpread: TPositionSpread =
    facts.position === undefined ? {} : { position: facts.position };

  return (
    buildCoreOutcome(entry, message, positionSpread) ??
    buildDependencyOutcome(entry, message, positionSpread) ??
    buildSymbolOrUnverified(entry, message, positionSpread)
  );
}
