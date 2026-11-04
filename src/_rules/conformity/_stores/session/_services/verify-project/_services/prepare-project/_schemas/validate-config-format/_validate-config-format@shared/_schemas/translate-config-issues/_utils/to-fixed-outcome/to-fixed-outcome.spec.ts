import { describe, expect, it } from 'vitest';

import { toFixedOutcome } from './to-fixed-outcome.util.js';

describe('toFixedOutcome', () => {
  it('fills the property path token and copies the diagnostic identity', () => {
    expect(
      toFixedOutcome(
        {
          constraint: 'configuration/empty-list',
          kind: 'fixed',
          message: 'Property "{path}" cannot be empty.',
          normativeReference: 'CONFIG_6',
        },
        'faf.common.foreignNodes[0].paths'
      )
    ).toEqual({
      constraint: 'configuration/empty-list',
      element: 'faf.common.foreignNodes[0].paths',
      family: 'configuration',
      message: 'Property "faf.common.foreignNodes[0].paths" cannot be empty.',
      normativeReference: 'CONFIG_6',
      propertyPath: 'faf.common.foreignNodes[0].paths',
    });
  });
});
