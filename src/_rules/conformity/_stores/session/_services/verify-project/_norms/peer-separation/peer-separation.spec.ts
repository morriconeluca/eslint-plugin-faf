import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPeerSeparation } from './index.js';

describe('verifyPeerSeparation', () => {
  it('returns the not-implemented outcome for peer-separation', () => {
    expect(verifyPeerSeparation(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'peer-separation',
        family: 'unverified',
        message: "Part 'peer-separation' is not implemented (§5).",
        normativeReference: '§5',
        reason: 'not-implemented',
      },
    ]);
  });
});
