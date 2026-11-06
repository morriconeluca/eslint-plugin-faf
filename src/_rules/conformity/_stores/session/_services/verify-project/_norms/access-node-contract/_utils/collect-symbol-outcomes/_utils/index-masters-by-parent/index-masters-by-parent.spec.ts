import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { indexMastersByParent } from './index-masters-by-parent.util.js';

const makeItem = (id: number, parentId: null | number): TInventoryItem => ({
  depth: 2,
  id,
  isSymlink: false,
  kind: 'file',
  parentId,
  path: `file-${id}.ts`,
  preorderEnd: id,
  preorderStart: id,
  realPath: `file-${id}.ts`,
  treeOrigin: 'src',
});

const makeClassification = (
  itemId: number,
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
  nodeKind,
  path: `file-${itemId}.ts`,
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

describe('indexMastersByParent', () => {
  it('indexes master nodes by their inventory parentId', () => {
    const items = [makeItem(0, 10), makeItem(1, 20), makeItem(2, null)];
    const classifications = [
      makeClassification(0, 'master-node'),
      makeClassification(1, 'fragment-node'),
      makeClassification(2, 'master-node'),
      makeClassification(99, 'master-node'),
    ];

    const map = indexMastersByParent(classifications, items);
    expect(map.size).toBe(1);
    expect(map.get(10)).toBe(classifications[0]);
    expect(map.has(20)).toBe(false);
  });
});
