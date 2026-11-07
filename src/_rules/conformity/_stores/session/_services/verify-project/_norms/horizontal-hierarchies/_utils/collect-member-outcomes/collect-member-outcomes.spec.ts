import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { THorizontalHierarchySet } from '../../../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';

import { collectMemberOutcomes } from './collect-member-outcomes.util.js';

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

const buildSet = (
  id: number,
  parentPath: string,
  isOrderable: boolean
): THorizontalHierarchySet => ({
  id,
  isOrderable,
  origin: 'local',
  parentPath,
  repetitions: [],
  siblings: [],
});

describe('collectMemberOutcomes', () => {
  it('returns empty outcomes when sets are empty', () => {
    const taxonomy = createTaxonomy([]);
    expect(collectMemberOutcomes([], taxonomy)).toEqual([]);
  });

  it('ignores orderable sets', () => {
    const parent = createClassification(1, 'src', 'directory', 'root-layer');
    const set = buildSet(0, 'src', true);
    const taxonomy = createTaxonomy([parent]);

    expect(collectMemberOutcomes([set], taxonomy)).toEqual([]);
  });

  it('collects outcomes for non-orderable sets', () => {
    const parent = createClassification(
      2,
      'src/_utils/widget',
      'directory',
      'fragment'
    );
    const set = buildSet(0, 'src/_utils/widget', false);
    const taxonomy = createTaxonomy([parent]);

    expect(collectMemberOutcomes([set], taxonomy)).toEqual([
      {
        constraint: 'classification/horizontal-hierarchy-members',
        element: 'src/_utils/widget',
        family: 'classification',
        message:
          "'src/_utils/widget' has a Horizontal Hierarchy over children that FAF does not allow to be ordered",
        normativeReference: 'FAF §6.9',
      },
    ]);
  });

  it('deduplicates multiple non-orderable applications under the same parent', () => {
    const parent = createClassification(3, 'src', 'directory', 'root-fragment');
    const firstParentSet = buildSet(0, 'src', false);
    const secondParentSet = buildSet(1, 'src', false);
    const taxonomy = createTaxonomy([parent]);

    const outcomes = collectMemberOutcomes(
      [firstParentSet, secondParentSet],
      taxonomy
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.element).toBe('src');
  });

  it('ignores sets whose parent is not in taxonomy', () => {
    const set = buildSet(0, 'src/missing', false);
    const taxonomy = createTaxonomy([]);

    expect(collectMemberOutcomes([set], taxonomy)).toEqual([]);
  });

  it('ignores sets whose parent directory has null domainKind', () => {
    const parent = createClassification(
      4,
      'src/unclassified',
      'directory',
      null
    );
    const set = buildSet(0, 'src/unclassified', false);
    const taxonomy = createTaxonomy([parent]);

    expect(collectMemberOutcomes([set], taxonomy)).toEqual([]);
  });

  it('ignores sets whose parent file has null nodeKind', () => {
    const parent = createClassification(5, 'src/file.ts', 'file', null, null);
    const set = buildSet(0, 'src/file.ts', false);
    const taxonomy = createTaxonomy([parent]);

    expect(collectMemberOutcomes([set], taxonomy)).toEqual([]);
  });

  it('reports sets whose parent file has non-null nodeKind', () => {
    const parent = createClassification(
      6,
      'src/file.ts',
      'file',
      null,
      'root-node'
    );
    const set = buildSet(0, 'src/file.ts', false);
    const taxonomy = createTaxonomy([parent]);

    expect(collectMemberOutcomes([set], taxonomy)).toHaveLength(1);
  });
});
