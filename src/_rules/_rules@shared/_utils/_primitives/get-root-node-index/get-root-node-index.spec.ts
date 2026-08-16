import { describe, expect, it } from 'vitest';

import type { TRootFragmentConfig } from '../../../_types/faf.type.js';

import { getRootNodeIndex } from './get-root-node-index.util.js';

describe('getRootNodeIndex', () => {
  const rfConfig: TRootFragmentConfig = {
    paths: ['src'],
    rootNodes: [['main.css', 'app/app.tsx'], ['main.tsx']],
  };

  it('returns the group index for a configured Root Node', () => {
    expect(getRootNodeIndex('src/main.tsx', rfConfig, 'src')).toBe(1);
    expect(getRootNodeIndex('src/app/app.tsx', rfConfig, 'src')).toBe(0);
  });

  it('returns -1 for a path that is not a configured Root Node', () => {
    expect(getRootNodeIndex('src/other.ts', rfConfig, 'src')).toBe(-1);
  });
});
