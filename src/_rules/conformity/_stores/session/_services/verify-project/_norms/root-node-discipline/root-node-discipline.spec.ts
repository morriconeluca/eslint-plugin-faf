import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyRootNodeDiscipline } from './index.js';

describe('verifyRootNodeDiscipline', () => {
  it('returns the not-implemented outcome for root-node-discipline', () => {
    expect(verifyRootNodeDiscipline(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'root-node-discipline',
        family: 'unverified',
        message: "Part 'root-node-discipline' is not implemented (§6.2.2).",
        normativeReference: '§6.2.2',
        reason: 'not-implemented',
      },
    ]);
  });
});
