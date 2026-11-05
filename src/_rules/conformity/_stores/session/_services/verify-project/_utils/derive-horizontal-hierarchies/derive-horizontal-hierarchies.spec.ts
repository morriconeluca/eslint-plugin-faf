import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { deriveHorizontalHierarchies } from './index.js';

describe('deriveHorizontalHierarchies', () => {
  it('returns empty data and the not-implemented outcome', () => {
    const model = verificationModel();
    const result = deriveHorizontalHierarchies(model.basis, model.taxonomy);
    expect(result.outcomes).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'derive-horizontal-hierarchies',
        family: 'unverified',
        message:
          "Part 'derive-horizontal-hierarchies' is not implemented (§4, §6.3.4, §6.9).",
        normativeReference: '§4, §6.3.4, §6.9',
        reason: 'not-implemented',
      },
    ]);
    expect(result.hierarchies).toEqual({ sets: [] });
  });
});
