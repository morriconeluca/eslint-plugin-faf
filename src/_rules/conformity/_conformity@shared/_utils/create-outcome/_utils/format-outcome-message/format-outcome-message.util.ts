import type { TFormatFacts } from './format-outcome-message.type.js';

export function formatOutcomeMessage(
  predicate: string,
  facts: TFormatFacts
): string {
  if (facts.cycle !== undefined) {
    const segments = facts.cycle.map((s) => s.join(' -> ')).join('; ');
    return `'${facts.element}' ${predicate}: ${segments}`;
  }
  if (facts.chain !== undefined) {
    const chainText = facts.chain.join(' -> ');
    return `'${facts.from}' reaches '${facts.to}' through ${chainText}: ${predicate}`;
  }
  if (facts.specifier !== undefined) {
    return `'${facts.from}' imports '${facts.to}' through '${facts.specifier}': ${predicate}`;
  }
  const element = facts.element ?? facts.propertyPath;
  if (
    facts.detail !== undefined &&
    facts.detail !== null &&
    facts.detail !== ''
  ) {
    const cleaned = facts.detail.replace(/\.$/, '');
    return `'${element}' ${predicate}: ${cleaned}`;
  }
  return `'${element}' ${predicate}`;
}
