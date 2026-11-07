import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
} from '../../../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isPeerNode } from './is-peer-node.util.js';

const makeClassification = (
  nodeKind: null | TNodeKind
): TItemClassification | undefined => ({
  domainKind: null,
  entryKind: 'file',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 0,
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

describe('isPeerNode', () => {
  it('returns true for category-node', () => {
    expect(isPeerNode(makeClassification('category-node'))).toBe(true);
  });

  it('returns false for undefined classification', () => {
    expect(isPeerNode(undefined)).toBe(false);
  });

  it('returns false for directory classification with null nodeKind', () => {
    expect(isPeerNode(makeClassification(null))).toBe(false);
  });

  it('returns false for foreign-node', () => {
    expect(isPeerNode(makeClassification('foreign-node'))).toBe(false);
  });

  it('returns false for root-node', () => {
    expect(isPeerNode(makeClassification('root-node'))).toBe(false);
  });

  it('returns false for unauthorized-logical-node', () => {
    expect(isPeerNode(makeClassification('unauthorized-logical-node'))).toBe(
      false
    );
  });
});
