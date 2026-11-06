import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
} from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { isPermittedEdge } from './is-permitted-edge.util.js';

const makeItem = (parentId: null | number): TInventoryItem => ({
  depth: 2,
  id: 1,
  isSymlink: false,
  kind: 'file',
  parentId,
  path: 'test',
  preorderEnd: 1,
  preorderStart: 1,
  realPath: 'test',
  treeOrigin: 'src',
});

const makeClassification = (
  nodeKind: null | TNodeKind
): TItemClassification => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 1,
  nodeKind,
  path: 'test',
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

describe('isPermittedEdge', () => {
  it('returns false when any required argument is undefined', () => {
    const item = makeItem(0);
    const classification = makeClassification('master-node');
    expect(isPermittedEdge(undefined, item, classification)).toBe(false);
    expect(isPermittedEdge(item, undefined, classification)).toBe(false);
    expect(isPermittedEdge(item, item, undefined)).toBe(false);
  });

  it('returns false when source parentId is null or does not match destination', () => {
    const sourceWithNull = makeItem(null);
    const destination = makeItem(0);
    const master = makeClassification('master-node');
    expect(isPermittedEdge(sourceWithNull, destination, master)).toBe(false);

    const sourceWithOtherParent = makeItem(1);
    expect(isPermittedEdge(sourceWithOtherParent, destination, master)).toBe(
      false
    );
  });

  it('returns false when destination nodeKind is not master-node or fragment-node', () => {
    const source = makeItem(0);
    const destination = makeItem(0);
    expect(
      isPermittedEdge(source, destination, makeClassification('sub-graph-node'))
    ).toBe(false);
    expect(
      isPermittedEdge(source, destination, makeClassification('root-node'))
    ).toBe(false);
    expect(isPermittedEdge(source, destination, makeClassification(null))).toBe(
      false
    );
  });

  it('returns true when destination is direct master-node or fragment-node', () => {
    const source = makeItem(0);
    const destination = makeItem(0);
    expect(
      isPermittedEdge(source, destination, makeClassification('master-node'))
    ).toBe(true);
    expect(
      isPermittedEdge(source, destination, makeClassification('fragment-node'))
    ).toBe(true);
  });
});
