import { describe, expect, it } from 'vitest';

import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { anchorDomainPath } from './index.js';

const item = (
  id: number,
  path: string,
  kind: TInventoryItem['kind'],
  parentId: null | number
): TInventoryItem => ({
  depth: parentId === null ? 0 : 1,
  id,
  isSymlink: false,
  kind,
  parentId,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const classification = (
  entry: TInventoryItem,
  domainKind: TItemClassification['domainKind'],
  nodeKind: TItemClassification['nodeKind']
): TItemClassification => ({
  domainKind,
  entryKind: entry.kind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: entry.id,
  nodeKind,
  path: entry.path,
  relationalQualifications: {
    isParentCategory: false,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    parentFragmentPath: null,
  },
  role: { kind: 'absent', roleName: null },
});

describe('anchorDomainPath', () => {
  it('prefers the fragment master over a later lintable sibling', () => {
    const fragment = item(0, 'src/widget', 'directory', null);
    const access = item(1, 'src/widget/index.ts', 'file', 0);
    const master = item(2, 'src/widget/widget.util.ts', 'file', 0);
    const inventory: TInventory = {
      items: [fragment, access, master],
      pathToId: new Map(inventoryItems(fragment, access, master)),
      realPathToId: new Map(),
    };
    const classified = [
      classification(fragment, 'fragment', null),
      classification(access, null, 'access-node'),
      classification(master, null, 'master-node'),
    ];
    expect(anchorDomainPath(inventory, model(classified), fragment)).toBe(
      'src/widget/widget.util.ts'
    );
  });

  it('ascends when a domain has no lintable child', () => {
    const parent = item(0, 'src', 'directory', null);
    const empty = item(1, 'src/empty', 'directory', 0);
    const file = item(2, 'src/a.ts', 'file', 0);
    const inventory: TInventory = {
      items: [parent, empty, file],
      pathToId: new Map([
        ['src', 0],
        ['src/a.ts', 2],
        ['src/empty', 1],
      ]),
      realPathToId: new Map(),
    };
    expect(anchorDomainPath(inventory, undefined, empty)).toBe('src/a.ts');
  });

  it('does not prefer a master outside a fragment', () => {
    const parent = item(0, 'src', 'directory', null);
    const master = item(1, 'src/b.ts', 'file', 0);
    const first = item(2, 'src/a.ts', 'file', 0);
    const inventory: TInventory = {
      items: [parent, master, first],
      pathToId: new Map(),
      realPathToId: new Map(),
    };
    const classified = [
      classification(parent, 'root-layer', null),
      classification(master, null, 'master-node'),
      classification(first, null, 'fragment-node'),
    ];
    expect(anchorDomainPath(inventory, model(classified), parent)).toBe(
      'src/a.ts'
    );
  });
});

const inventoryItems = (
  ...items: readonly TInventoryItem[]
): readonly (readonly [string, number])[] =>
  items.map((entry) => [entry.path, entry.id]);

const model = (classified: readonly TItemClassification[]) => ({
  byItemId: new Map(classified.map((entry) => [entry.itemId, entry])),
  byPath: new Map(classified.map((entry) => [entry.path, entry])),
  classifications: classified,
});
