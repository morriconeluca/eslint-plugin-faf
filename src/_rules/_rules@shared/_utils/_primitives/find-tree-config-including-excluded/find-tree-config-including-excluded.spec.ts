import { describe, expect, it } from 'vitest';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TFafSettings } from '../../../_types/faf.type.js';

import { findTreeConfigIncludingExcluded } from './find-tree-config-including-excluded.util.js';

describe('findTreeConfigIncludingExcluded', () => {
  const settings: TFafSettings = {
    trees: [
      {
        excludes: ['src/configs'],
        includes: ['src'],
        roles: [['type']],
      },
    ],
  };

  it('should find tree config even for excluded path', () => {
    state.treeConfigIncludingExcludedCache.clear();
    const config = findTreeConfigIncludingExcluded(
      'src/configs/env.ts',
      settings
    );
    expect(config).not.toBeNull();
    expect(config?.includes).toContain('src');
  });
});
