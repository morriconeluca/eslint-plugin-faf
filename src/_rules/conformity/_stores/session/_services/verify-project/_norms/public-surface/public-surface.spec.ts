import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPublicSurface } from './index.js';

describe('verifyPublicSurface', () => {
  it('returns the not-implemented outcome for public-surface', () => {
    expect(verifyPublicSurface(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'public-surface',
        family: 'unverified',
        message: "'public-surface' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
