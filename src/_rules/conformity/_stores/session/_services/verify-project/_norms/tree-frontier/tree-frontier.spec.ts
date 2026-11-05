import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyTreeFrontier } from './index.js';

describe('verifyTreeFrontier', () => {
  it('returns the not-implemented outcome for tree-frontier', () => {
    expect(verifyTreeFrontier(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'tree-frontier',
        family: 'unverified',
        message: "Part 'tree-frontier' is not implemented (§7.1, §7.2).",
        normativeReference: '§7.1, §7.2',
        reason: 'not-implemented',
      },
    ]);
  });
});
