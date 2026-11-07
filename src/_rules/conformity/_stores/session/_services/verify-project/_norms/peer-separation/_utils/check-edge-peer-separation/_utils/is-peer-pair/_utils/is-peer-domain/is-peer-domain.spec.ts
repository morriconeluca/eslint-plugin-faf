import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
} from '../../../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';

import { isPeerDomain } from './is-peer-domain.util.js';

const makeClassification = (
  domainKind: null | TLogicalDomainKind
): TItemClassification | undefined => ({
  domainKind,
  entryKind: domainKind === null ? 'file' : 'directory',
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId: 0,
  nodeKind: null,
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

describe('isPeerDomain', () => {
  it('returns true for category', () => {
    expect(isPeerDomain(makeClassification('category'))).toBe(true);
  });

  it('returns false for undefined classification', () => {
    expect(isPeerDomain(undefined)).toBe(false);
  });

  it('returns false for file classification with null domainKind', () => {
    expect(isPeerDomain(makeClassification(null))).toBe(false);
  });

  it('returns false for foreign-domain', () => {
    expect(isPeerDomain(makeClassification('foreign-domain'))).toBe(false);
  });

  it('returns false for root-fragment', () => {
    expect(isPeerDomain(makeClassification('root-fragment'))).toBe(false);
  });
});
