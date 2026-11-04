import { describe, expect, it } from 'vitest';

import { verifyProject } from './index.js';

describe('verifyProject', () => {
  it('returns no outcomes until the verification pipeline is composed', () => {
    const result = verifyProject({
      configPath: '/repo/fafconfig.ts',
      workingDirectory: '/repo',
    });
    expect(result.outcomes).toEqual([]);
  });
});
