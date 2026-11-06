import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyReExportProhibition } from './index.js';

describe('verifyReExportProhibition', () => {
  it('returns the not-implemented outcome for re-export-prohibition', () => {
    expect(verifyReExportProhibition(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 're-export-prohibition',
        family: 'unverified',
        message: "'re-export-prohibition' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
