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
        message: "Part 'public-surface' is not implemented (§7.1).",
        normativeReference: '§7.1',
        reason: 'not-implemented',
      },
    ]);
  });
});
