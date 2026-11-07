import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../../../../../../../_verify-project@shared/_mocks/verification-model.mock.js';
import { collectLogicalNodePaths } from './collect-logical-node-paths.util.js';

describe('collectLogicalNodePaths', () => {
  it('returns empty array when no items exist', () => {
    expect(collectLogicalNodePaths(verificationModel())).toEqual([]);
  });
});
