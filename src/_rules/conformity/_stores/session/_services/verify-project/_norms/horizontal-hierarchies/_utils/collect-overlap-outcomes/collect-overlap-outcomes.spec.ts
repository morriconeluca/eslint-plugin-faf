import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { THorizontalHierarchyConflict } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

import { collectOverlapOutcomes } from './index.js';

const defaultRole = { kind: 'absent' as const, roleName: null };

const defaultQualifications = {
  isParentCategory: false,
  isPathFragment: false,
  isPrivateCategory: false,
  isSubFragment: false,
  isSubLayer: false,
  parentFragmentPath: null,
};

const createClassification = (
  itemId: number,
  path: string,
  entryKind: 'directory' | 'file',
  domainKind: null | TLogicalDomainKind = null,
  nodeKind: null | TNodeKind = null
): TItemClassification => ({
  domainKind,
  entryKind,
  fragmentInternalRank: null,
  imposedRoleName: null,
  itemId,
  nodeKind,
  path,
  relationalQualifications: defaultQualifications,
  role: defaultRole,
});

const createTaxonomy = (
  items: readonly TItemClassification[]
): TTaxonomyModel => ({
  byItemId: new Map(items.map((entry) => [entry.itemId, entry])),
  byPath: new Map(items.map((entry) => [entry.path, entry])),
  classifications: items,
});

describe('collectOverlapOutcomes', () => {
  it('returns empty outcomes when conflicts are empty', () => {
    const taxonomy = createTaxonomy([]);
    expect(collectOverlapOutcomes([], taxonomy)).toEqual([]);
  });

  it('collects outcomes for conflict entries on classified directory', () => {
    const child = createClassification(
      1,
      'src/_types',
      'directory',
      'category'
    );
    const conflict: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 1,
    };
    const taxonomy = createTaxonomy([child]);

    expect(collectOverlapOutcomes([conflict], taxonomy)).toEqual([
      {
        constraint: 'classification/horizontal-hierarchy-overlap',
        element: 'src/_types',
        family: 'classification',
        message:
          "'src/_types' is selected by more than one Horizontal Hierarchy",
        normativeReference: 'FAF §4',
      },
    ]);
  });

  it('collects outcomes for conflict entries on classified file', () => {
    const child = createClassification(
      2,
      'src/main.ts',
      'file',
      null,
      'root-node'
    );
    const conflict: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 2,
    };
    const taxonomy = createTaxonomy([child]);

    expect(collectOverlapOutcomes([conflict], taxonomy)).toEqual([
      {
        constraint: 'classification/horizontal-hierarchy-overlap',
        element: 'src/main.ts',
        family: 'classification',
        message:
          "'src/main.ts' is selected by more than one Horizontal Hierarchy",
        normativeReference: 'FAF §4',
      },
    ]);
  });

  it('deduplicates multiple conflict entries for the same child element', () => {
    const child = createClassification(
      3,
      'src/shared.ts',
      'file',
      null,
      'root-node'
    );
    const conflictA: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 3,
    };
    const conflictB: THorizontalHierarchyConflict = {
      hierarchyIds: [2, 3],
      itemId: 3,
    };
    const taxonomy = createTaxonomy([child]);

    const outcomes = collectOverlapOutcomes([conflictA, conflictB], taxonomy);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.element).toBe('src/shared.ts');
  });

  it('ignores conflicts whose child is not in taxonomy', () => {
    const conflict: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 999,
    };
    const taxonomy = createTaxonomy([]);

    expect(collectOverlapOutcomes([conflict], taxonomy)).toEqual([]);
  });

  it('ignores conflicts whose child directory has null domainKind', () => {
    const child = createClassification(
      4,
      'src/unclassified',
      'directory',
      null
    );
    const conflict: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 4,
    };
    const taxonomy = createTaxonomy([child]);

    expect(collectOverlapOutcomes([conflict], taxonomy)).toEqual([]);
  });

  it('ignores conflicts whose child file has null nodeKind', () => {
    const child = createClassification(5, 'src/mystery.ts', 'file', null, null);
    const conflict: THorizontalHierarchyConflict = {
      hierarchyIds: [0, 1],
      itemId: 5,
    };
    const taxonomy = createTaxonomy([child]);

    expect(collectOverlapOutcomes([conflict], taxonomy)).toEqual([]);
  });
});
