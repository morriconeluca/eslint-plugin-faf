import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyExternalDependencies } from './index.js';

describe('verifyExternalDependencies', () => {
  it('returns the not-implemented outcome for external-dependencies', () => {
    expect(verifyExternalDependencies(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'external-dependencies',
        family: 'unverified',
        message: "'external-dependencies' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
