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
  TOutcome,
  TOutcomeFacts,
  TPathFacts,
  TSymbolConstraint,
  TUnverifiedConstraint,
  TUnverifiedFacts,
} from '../../../../_types/outcome.type.js';

export const buildOutcomeRecord = (() => {
  type TPositionSpread =
    | Record<string, never>
    | { readonly position: { readonly column: number; readonly line: number } };

  const isAcyclicity = (c: TConstraint): c is TAcyclicityConstraint =>
    c.startsWith('acyclicity/');
  const isClassification = (c: TConstraint): c is TClassificationConstraint =>
    c.startsWith('classification/');
  const isConfig = (c: TConstraint): c is TConfigConstraint =>
    c.startsWith('configuration/');
  const isDependency = (c: TConstraint): c is TDependencyConstraint =>
    c.startsWith('dependency/');
  const isSymbol = (c: TConstraint): c is TSymbolConstraint =>
    c.startsWith('symbol/');
  const isUnverified = (c: TConstraint): c is TUnverifiedConstraint =>
    c.startsWith('unverified/');

  const isCycleFacts = (f: TOutcomeFacts): f is TCycleFacts => 'cycle' in f;
  const isConfigFacts = (f: TOutcomeFacts): f is TConfigFacts =>
    'propertyPath' in f;
  const isDependencyFacts = (f: TOutcomeFacts): f is TEdgeFacts | TPathFacts =>
    'from' in f;
  const isUnverifiedFacts = (f: TOutcomeFacts): f is TUnverifiedFacts =>
    'reason' in f;
  const hasElement = (
    f: TOutcomeFacts
  ): f is TOutcomeFacts & { readonly element: string } =>
    'element' in f && typeof f.element === 'string';

  function buildCoreOutcome(
    code: TConstraint,
    entry: TCatalogEntry,
    message: string,
    facts: TOutcomeFacts,
    positionSpread: TPositionSpread
  ): TOutcome | undefined {
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
  }

  function buildDependencyOutcome(
    code: TConstraint,
    entry: TCatalogEntry,
    message: string,
    facts: TOutcomeFacts,
    positionSpread: TPositionSpread
  ): TOutcome | undefined {
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
  }

  function buildSymbolOrUnverified(
    code: TConstraint,
    entry: TCatalogEntry,
    message: string,
    facts: TOutcomeFacts,
    positionSpread: TPositionSpread
  ): TOutcome {
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
    const unverifiedConstraint: TUnverifiedConstraint = isUnverified(code)
      ? code
      : 'unverified/unsupported-syntax';
    return {
      ...positionSpread,
      constraint: unverifiedConstraint,
      element: hasElement(facts) ? facts.element : '',
      family: 'unverified',
      message,
      normativeReference: entry.normativeReference,
      reason: isUnverifiedFacts(facts) ? facts.reason : 'unsupported-syntax',
    };
  }

  return function buildOutcomeRecord(
    code: TConstraint,
    entry: TCatalogEntry,
    message: string,
    facts: TOutcomeFacts
  ): TOutcome {
    const positionSpread: TPositionSpread =
      facts.position === undefined ? {} : { position: facts.position };

    return (
      buildCoreOutcome(code, entry, message, facts, positionSpread) ??
      buildDependencyOutcome(code, entry, message, facts, positionSpread) ??
      buildSymbolOrUnverified(code, entry, message, facts, positionSpread)
    );
  };
})();
