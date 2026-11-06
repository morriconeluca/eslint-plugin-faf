import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyNomenclature } from './index.js';

describe('verifyNomenclature', () => {
  it('returns the not-implemented outcome for nomenclature', () => {
    expect(verifyNomenclature(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'nomenclature',
        family: 'unverified',
        message: "'nomenclature' is not implemented",
        normativeReference: 'D-03',
        reason: 'not-implemented',
      },
    ]);
  });
});
