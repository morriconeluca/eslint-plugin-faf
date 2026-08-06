import { describe, expect, it } from 'vitest';

import { clearDirCache } from '#_rules@shared/_utils/_primitives/clear-dir-cache/index.js';
import { seedDirCache } from '#_rules@shared/_utils/_primitives/seed-dir-cache/index.js';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { getPrivateCategoryInfo } from './get-private-category-info.util.js';

describe('getPrivateCategoryInfo', () => {
  const config: TTreeConfig = {
    categories: [
      { name: '_components', role: 'component' },
      { name: '_types', role: 'type' },
    ],
    includes: ['src'],
    roles: [['component'], ['type']],
  };

  it('should return private category info when path is inside private category', () => {
    clearDirCache();

    seedDirCache('src/example', ['index.ts'], ['_components']);
    seedDirCache('src/example/_components', [], ['child']);
    seedDirCache(
      'src/example/_components/child',
      ['index.ts', 'child.tsx'],
      []
    );

    const info = getPrivateCategoryInfo(
      'src/example/_components/child',
      config
    );
    expect(info).not.toBeNull();
    expect(info?.owner).toBe('src/example');
    expect(info?.privateCategoryPath).toBe('src/example/_components');
  });

  it('should return null when not inside a private category', () => {
    clearDirCache();

    seedDirCache('src/example', ['index.ts'], []);

    const info = getPrivateCategoryInfo('src/example', config);
    expect(info).toBeNull();
  });
});
