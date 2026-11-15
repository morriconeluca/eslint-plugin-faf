import type { TOutcomeCreators } from './create-outcome.type.js';

import { OUTCOME_CATALOG } from './create-outcome.config.js';

export const createOutcome: TOutcomeCreators = {
  acyclicity: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const segments = facts.cycle
      .map((segment) => segment.join(' -> '))
      .join('; ');
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      constraint,
      cycle: facts.cycle,
      element: facts.element,
      family: 'acyclicity',
      message: `'${facts.element}' ${entry.predicate}: ${segments}`,
      normativeReference: entry.normativeReference,
    };
  },

  classification: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const message =
      typeof facts.detail === 'string' && facts.detail !== ''
        ? `'${facts.element}' ${entry.predicate}: ${facts.detail.replace(/\.$/, '')}`
        : `'${facts.element}' ${entry.predicate}`;
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      constraint,
      element: facts.element,
      family: 'classification',
      message,
      normativeReference: entry.normativeReference,
    };
  },

  configuration: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const element = facts.element ?? facts.propertyPath;
    const message =
      typeof facts.detail === 'string' && facts.detail !== ''
        ? `'${element}' ${entry.predicate}: ${facts.detail.replace(/\.$/, '')}`
        : `'${element}' ${entry.predicate}`;
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      constraint,
      element,
      family: 'configuration',
      message,
      normativeReference: entry.normativeReference,
      propertyPath: facts.propertyPath,
    };
  },

  edge: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      constraint,
      element: facts.element ?? facts.from,
      family: 'dependency',
      from: facts.from,
      importIndex: facts.importIndex,
      message: `'${facts.from}' imports '${facts.to}' through '${facts.specifier}': ${entry.predicate}`,
      normativeReference: entry.normativeReference,
      specifier: facts.specifier,
      to: facts.to,
    };
  },

  path: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const chainText = facts.chain.join(' -> ');
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      ...(facts.specifier !== undefined && { specifier: facts.specifier }),
      chain: facts.chain,
      constraint,
      element: facts.element ?? facts.from,
      family: 'dependency',
      from: facts.from,
      importIndex: facts.importIndex,
      message: `'${facts.from}' reaches '${facts.to}' through ${chainText}: ${entry.predicate}`,
      normativeReference: entry.normativeReference,
      to: facts.to,
    };
  },

  symbol: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const message =
      typeof facts.detail === 'string' && facts.detail !== ''
        ? `'${facts.element}' ${entry.predicate}: ${facts.detail.replace(/\.$/, '')}`
        : `'${facts.element}' ${entry.predicate}`;
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      ...(facts.symbolCount !== undefined && {
        symbolCount: facts.symbolCount,
      }),
      ...(facts.symbolName !== undefined && { symbolName: facts.symbolName }),
      constraint,
      element: facts.element,
      family: 'symbol',
      message,
      normativeReference: entry.normativeReference,
    };
  },

  unverified: (constraint, facts) => {
    const entry = OUTCOME_CATALOG[constraint];
    const message =
      typeof facts.detail === 'string' && facts.detail !== ''
        ? `'${facts.element}' ${entry.predicate}: ${facts.detail.replace(/\.$/, '')}`
        : `'${facts.element}' ${entry.predicate}`;
    return {
      ...(facts.position !== undefined && { position: facts.position }),
      constraint,
      element: facts.element,
      family: 'unverified',
      message,
      normativeReference: entry.normativeReference,
      reason: facts.reason,
    };
  },
};
