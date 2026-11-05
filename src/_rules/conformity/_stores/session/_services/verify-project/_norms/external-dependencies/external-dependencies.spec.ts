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
        message: "Part 'external-dependencies' is not implemented (§7.3).",
        normativeReference: '§7.3',
        reason: 'not-implemented',
      },
    ]);
  });
});
