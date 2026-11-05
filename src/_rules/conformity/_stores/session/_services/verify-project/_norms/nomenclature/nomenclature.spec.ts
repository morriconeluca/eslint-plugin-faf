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
        message: "Part 'nomenclature' is not implemented (§4, §6.6, §6.3.5).",
        normativeReference: '§4, §6.6, §6.3.5',
        reason: 'not-implemented',
      },
    ]);
  });
});
