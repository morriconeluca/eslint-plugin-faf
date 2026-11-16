import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../_conformity@shared/_utils/assert-invariant/index.js';
import { inventoryFromEntries } from '../../../../_classify-taxonomy@shared/_mocks/inventory-from-entries.mock.js';
import { collectForeignFamilies } from './collect-foreign-families.util.js';

const inventory = inventoryFromEntries(
  [
    {
      isSymlink: false,
      kind: 'directory',
      path: 'src',
      realPath: 'src',
    },
    {
      isSymlink: false,
      kind: 'directory',
      path: 'src/docs',
      realPath: 'src/docs',
    },
    {
      isSymlink: false,
      kind: 'file',
      path: 'src/docs/a.md',
      realPath: 'src/docs/a.md',
    },
    {
      isSymlink: false,
      kind: 'file',
      path: 'src/readme.md',
      realPath: 'src/readme.md',
    },
  ],
  ['src']
);

const originItem = inventory.items.find((item) => item.path === 'src');
assertInvariant(originItem !== undefined, 'origin is present');
const origin = originItem;

describe('collectForeignFamilies', () => {
  it('selects files under a directory scope and ignores missing, file, or invalid-pattern scopes', () => {
    const result = collectForeignFamilies(inventory, inventory.items, origin, [
      {
        paths: ['src/missing', 'src/readme.md', 'src/docs'],
        patterns: ['*.md', '[invalid-globstar***'],
      },
    ]);
    expect([...result.nodePaths]).toEqual(['src/docs/a.md']);
  });
});
