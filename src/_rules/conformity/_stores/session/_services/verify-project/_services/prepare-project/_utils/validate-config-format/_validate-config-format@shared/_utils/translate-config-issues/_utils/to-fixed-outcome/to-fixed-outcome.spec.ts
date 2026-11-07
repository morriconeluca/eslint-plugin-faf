import { describe, expect, it } from 'vitest';

import { toFixedOutcome } from './to-fixed-outcome.util.js';

describe('toFixedOutcome', () => {
  it('creates an outcome for the constraint at the property path', () => {
    expect(
      toFixedOutcome(
        {
          constraint: 'configuration/empty-list',
          kind: 'fixed',
        },
        'faf.common.foreignNodes[0].paths'
      )
    ).toEqual({
      constraint: 'configuration/empty-list',
      element: 'faf.common.foreignNodes[0].paths',
      family: 'configuration',
      message: "'faf.common.foreignNodes[0].paths' cannot be an empty list",
      normativeReference: 'D-14',
      propertyPath: 'faf.common.foreignNodes[0].paths',
    });
  });
});
