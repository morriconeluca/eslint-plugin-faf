import { describe, expect, it } from 'vitest';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFafSettings } from '../../../_types/faf.type.js';

import { findTreeConfig } from './find-tree-config.util.js';

describe('findTreeConfig', () => {
  const settings: TFafSettings = {
    trees: [
      {
        excludes: ['src/configs'],
        includes: ['src'],
        roles: [['type']],
      },
    ],
  };

  it('should find tree config for matching path', () => {
    state.treeConfigCache.clear();
    const config = findTreeConfig('src/foo.ts', settings);
    expect(config).not.toBeNull();
    expect(config?.includes).toContain('src');
  });

  it('should return null for excluded path', () => {
    state.treeConfigCache.clear();
    const config = findTreeConfig('src/configs/env.ts', settings);
    expect(config).toBeNull();
  });
});
