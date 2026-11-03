import { describe, expect, it } from 'vitest';

import { assertInvariant } from '../../../../../../_domain/_utils/assert-invariant/index.js';
import { buildInventory } from '../../../../../../_inventory/_utils/build-inventory/index.js';
import { collectFamilyMatches } from './collect-family-matches.util.js';

const inventory = buildInventory(
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
).inventory;

const originItem = inventory.items.find((item) => item.path === 'src');
assertInvariant(originItem !== undefined, 'origin is present');
const origin = originItem;

describe('collectFamilyMatches', () => {
  it('selects files under a directory scope and ignores a missing or file scope', () => {
    const nodeItemIds = new Set<number>();
    const nodePaths = new Set<string>();
    collectFamilyMatches(
      inventory,
      inventory.items,
      origin,
      ['src/missing', 'src/readme.md', 'src/docs'],
      [(relativePath) => relativePath.endsWith('.md')],
      nodeItemIds,
      nodePaths
    );
    expect([...nodePaths]).toEqual(['src/docs/a.md']);
  });
});
