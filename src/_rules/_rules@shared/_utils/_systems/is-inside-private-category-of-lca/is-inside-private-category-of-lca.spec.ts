import { describe, expect, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { isInsidePrivateCategoryOfLca } from './is-inside-private-category-of-lca.util.js';

describe('isInsidePrivateCategoryOfLca', () => {
  const config: TTreeConfig = {
    categories: [{ name: '_components', role: 'component' }],
    includes: ['src'],
    roles: [['component']],
  };

  it('returns true when B is inside a Private Category owned by the LCA', () => {
    clearDirCache();

    seedDirCache('src/example', ['index.ts'], ['_components']);
    seedDirCache('src/example/_components', [], ['child']);
    seedDirCache(
      'src/example/_components/child',
      ['index.ts', 'child.tsx'],
      []
    );

    expect(
      isInsidePrivateCategoryOfLca(
        'src/example/_components/child',
        'src/example',
        config
      )
    ).toBe(true);
  });

  it('returns false when the Private Category is not owned by the LCA', () => {
    clearDirCache();

    seedDirCache('src/example', ['index.ts'], ['_components']);
    seedDirCache('src/example/_components', [], ['child']);
    seedDirCache(
      'src/example/_components/child',
      ['index.ts', 'child.tsx'],
      []
    );
    seedDirCache('src/other', ['index.ts'], []);

    expect(
      isInsidePrivateCategoryOfLca(
        'src/example/_components/child',
        'src/other',
        config
      )
    ).toBe(false);
  });
});
