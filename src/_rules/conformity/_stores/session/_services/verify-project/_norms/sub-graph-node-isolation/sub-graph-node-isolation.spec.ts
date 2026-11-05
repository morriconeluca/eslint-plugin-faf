import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifySubGraphNodeIsolation } from './index.js';

describe('verifySubGraphNodeIsolation', () => {
  it('returns the not-implemented outcome for sub-graph-node-isolation', () => {
    expect(verifySubGraphNodeIsolation(verificationModel())).toEqual([
      {
        constraint: 'unverified/not-implemented',
        element: 'sub-graph-node-isolation',
        family: 'unverified',
        message: "Part 'sub-graph-node-isolation' is not implemented (§4).",
        normativeReference: '§4',
        reason: 'not-implemented',
      },
    ]);
  });
});
