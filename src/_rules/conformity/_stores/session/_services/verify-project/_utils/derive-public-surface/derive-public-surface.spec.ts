import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { derivePublicSurface } from './index.js';

describe('derivePublicSurface', () => {
  it('returns empty data and the not-implemented outcome', () => {
    const model = verificationModel();
    const result = derivePublicSurface(model.basis, model.taxonomy);
    expect(result.outcomes).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'derive-public-surface',
        family: 'unverified',
        message: "Part 'derive-public-surface' is not implemented (§7.1).",
        normativeReference: '§7.1',
        reason: 'not-implemented',
      },
    ]);
    expect(result.surface).toEqual({ trees: [] });
  });
});
