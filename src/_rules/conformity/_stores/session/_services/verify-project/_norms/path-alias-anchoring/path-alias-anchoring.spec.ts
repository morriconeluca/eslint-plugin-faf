import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyPathAliasAnchoring } from './index.js';

describe('verifyPathAliasAnchoring', () => {
  it('returns the not-implemented outcome for path-alias-anchoring', () => {
    expect(verifyPathAliasAnchoring(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'path-alias-anchoring',
        family: 'unverified',
        message: "'path-alias-anchoring' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
