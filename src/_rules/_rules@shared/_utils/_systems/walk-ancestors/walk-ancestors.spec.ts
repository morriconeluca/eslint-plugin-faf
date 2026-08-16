import { describe, expect, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';
import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { walkAncestors } from './walk-ancestors.util.js';

describe('walkAncestors', () => {
  const config: TTreeConfig = {
    categories: [{ name: '_components', role: 'component' }],
    excludes: ['src/configs'],
    includes: ['src'],
    roles: [['component']],
  };

  it('walks from a Fragment up to the tree boundary, classifying each ancestor and its parent', () => {
    clearDirCache();
    seedDirCache('src', [], ['_components', 'configs']);
    seedDirCache('src/_components', [], ['button']);
    seedDirCache(
      'src/_components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );

    const chain = walkAncestors('src/_components/button', config);
    expect(chain).toEqual([
      {
        dir: 'src/_components/button',
        folderName: 'button',
        parentDir: 'src/_components',
        parentFolderName: '_components',
        parentType: 'category',
        type: 'fragment',
      },
      {
        dir: 'src/_components',
        folderName: '_components',
        parentDir: 'src',
        parentFolderName: 'src',
        parentType: 'invalid-fragment',
        type: 'category',
      },
      {
        dir: 'src',
        folderName: 'src',
        parentDir: '.',
        parentFolderName: '.',
        parentType: 'unknown',
        type: 'invalid-fragment',
      },
    ]);
  });

  it('stops before entering an excluded ancestor', () => {
    clearDirCache();
    expect(walkAncestors('src/configs', config)).toEqual([]);
  });

  it('stops immediately for a directory outside includes', () => {
    clearDirCache();
    seedDirCache('other/place', [], []);
    expect(walkAncestors('other/place', config)).toEqual([]);
  });

  it('caches the result for repeated calls on the same directory', () => {
    clearDirCache();
    seedDirCache('src', [], ['_components', 'configs']);
    seedDirCache('src/_components', [], ['button']);
    seedDirCache(
      'src/_components/button',
      ['index.ts', 'button.component.tsx'],
      []
    );

    const first = walkAncestors('src/_components/button', config);
    const second = walkAncestors('src/_components/button', config);
    expect(second).toBe(first);
    expect(state.ancestorChainCache.get('src/_components/button')).toBe(first);
  });
});
