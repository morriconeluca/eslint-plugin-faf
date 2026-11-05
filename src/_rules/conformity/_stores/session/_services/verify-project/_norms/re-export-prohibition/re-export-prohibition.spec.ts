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
        message: "Part 're-export-prohibition' is not implemented (§5).",
        normativeReference: '§5',
        reason: 'not-implemented',
      },
    ]);
  });
});
