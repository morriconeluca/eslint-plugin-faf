import { describe, expect, it } from 'vitest';

import { state } from '#_utils@shared/_stores/cache/index.js';

import type { TTreeConfig } from '../../../_types/faf.type.js';

import { getCategoryConfig } from './get-category-config.util.js';

describe('getCategoryConfig', () => {
  const config: TTreeConfig = {
    categories: [
      { name: '_rules', role: 'rule' },
      { name: '_utils', role: 'util' },
    ],
    includes: ['src'],
    roles: [['type']],
  };

  it('should find category config for category dir', () => {
    state.categoryConfigCache.clear();
    const cat = getCategoryConfig('src/_rules', config);
    expect(cat).not.toBeNull();
    expect(cat?.name).toBe('_rules');
  });

  it('should return null for non-category dir', () => {
    state.categoryConfigCache.clear();
    const cat = getCategoryConfig('src/foo', config);
    expect(cat).toBeNull();
  });
});
