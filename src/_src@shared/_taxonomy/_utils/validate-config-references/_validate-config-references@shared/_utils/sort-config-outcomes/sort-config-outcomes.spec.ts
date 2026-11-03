import { describe, expect, it } from 'vitest';

import type { TConfigOutcome } from '../../../../../../_domain/_types/outcome.type.js';

import { sortConfigOutcomes } from './sort-config-outcomes.util.js';

function outcome(
  propertyPath: string,
  constraint: TConfigOutcome['constraint'],
  element: string
): TConfigOutcome {
  return {
    constraint,
    element,
    family: 'configuration',
    message: element,
    normativeReference: 'CONFIG_4',
    propertyPath,
  };
}

describe('sortConfigOutcomes', () => {
  it('orders by property path, constraint, and element using code-unit order', () => {
    const sorted = sortConfigOutcomes([
      outcome('faf.locals[0]', 'configuration/expected-file', '_a'),
      outcome('faf.locals[0]', 'configuration/expected-file', '[id]'),
      outcome('faf.locals[0]', 'configuration/expected-directory', 'z'),
      outcome('faf.locals[1]', 'configuration/non-existent-path', 'm'),
    ]);
    expect(
      sorted.map(
        (item) => `${item.propertyPath}|${item.constraint}|${item.element}`
      )
    ).toEqual([
      'faf.locals[0]|configuration/expected-directory|z',
      'faf.locals[0]|configuration/expected-file|[id]',
      'faf.locals[0]|configuration/expected-file|_a',
      'faf.locals[1]|configuration/non-existent-path|m',
    ]);
  });
});
