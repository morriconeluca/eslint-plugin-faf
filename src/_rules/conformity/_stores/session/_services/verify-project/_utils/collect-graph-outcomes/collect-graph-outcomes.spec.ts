import { describe, expect, it } from 'vitest';

import type { TUnverifiedOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';

import { collectGraphOutcomes } from './index.js';

describe('collectGraphOutcomes', () => {
  it('returns the unverified outcomes until graph stages are composed', () => {
    const outcome: TUnverifiedOutcome = {
      constraint: 'unverified/unresolved-import',
      element: 'src/a.ts',
      family: 'unverified',
      message: 'Import in src/a.ts could not be resolved: missing',
      normativeReference: '§5',
      reason: 'missing',
    };
    expect(collectGraphOutcomes([outcome])).toEqual([outcome]);
    expect(collectGraphOutcomes([])).toEqual([]);
  });
});
