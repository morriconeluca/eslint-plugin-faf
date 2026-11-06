import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TLogicalDomainKind,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  THorizontalHierarchyConflict,
  THorizontalHierarchySet,
} from '../../_verify-project@shared/_types/_compounds/horizontal-hierarchies.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyHorizontalHierarchies } from './index.js';

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

const buildModel = (
  sets: readonly THorizontalHierarchySet[],
  conflicts: readonly THorizontalHierarchyConflict[],
  classifications: readonly TItemClassification[]
): TVerificationModel => ({
  ...verificationModel(),
  hierarchies: { conflicts, sets },
  taxonomy: createTaxonomy(classifications),
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

describe('verifyHorizontalHierarchies', () => {
  it('returns empty outcomes when hierarchies are empty', () => {
    const model = buildModel([], [], []);
    expect(verifyHorizontalHierarchies(model)).toEqual([]);
  });

  describe('orderable sibling sets produce no outcomes', () => {
    it.each([
      ['Categories non private sorelle', 'src', 'root-layer'],
      ['Sub-Categories sorelle', 'src/_utils', 'category'],
      [
        'Sub-Categories sorelle in Private Category',
        'src/_utils/btn/_types',
        'category',
      ],
      ['Layers fratelli', 'src', 'root-layer'],
      ['Sub-Layers fratelli', 'src/_domain', 'layer'],
      ['Logical Nodes diretti di un Fragment', 'src/_utils/widget', 'fragment'],
      ['Root Nodes di un Root Fragment', 'src', 'root-fragment'],
    ] as const)(
      'admits valid sibling set: %s',
      (_name, parentPath, domainKind) => {
        const parent = createClassification(
          1,
          parentPath,
          'directory',
          domainKind
        );
        const set = buildSet(0, parentPath, true);
        const model = buildModel([set], [], [parent]);

        expect(verifyHorizontalHierarchies(model)).toEqual([]);
      }
    );
  });

  describe('non-orderable sibling sets produce horizontal-hierarchy-members', () => {
    it.each([
      ['Private Categories sorelle', 'src/_utils/widget', 'fragment'],
      ['Fragments fratelli in Category', 'src/_utils', 'category'],
      ['Category Nodes fratelli', 'src/_types', 'category'],
      ['Path Sub-Categories sorelle', 'src/_apis', 'category'],
      ['Path Sub-Category e Path Fragment fratelli', 'src/_apis', 'category'],
      ['Path Fragments fratelli', 'src/_apis', 'category'],
      ['Root Fragments fratelli', 'src', 'root-fragment'],
      ['Fractal Branch', 'src', 'root-layer'],
      ['Foreign Domain', 'src', 'root-layer'],
      [
        'Logical Nodes e Logical Domains fratelli insieme',
        'src/_types',
        'category',
      ],
      ['elementi con genitori diversi', 'src/_domain', 'layer'],
    ] as const)(
      'rejects invalid sibling set: %s',
      (_name, parentPath, domainKind) => {
        const parent = createClassification(
          1,
          parentPath,
          'directory',
          domainKind
        );
        const set = buildSet(0, parentPath, false);
        const model = buildModel([set], [], [parent]);

        expect(verifyHorizontalHierarchies(model)).toEqual([
          {
            constraint: 'classification/horizontal-hierarchy-members',
            element: parentPath,
            family: 'classification',
            message: `'${parentPath}' has a Horizontal Hierarchy over children that FAF does not allow to be ordered`,
            normativeReference: 'FAF §6.9',
          },
        ]);
      }
    );
  });

  it('admits multiple disjoint hierarchies under the same parent without outcomes', () => {
    const parent = createClassification(1, 'src/_domain', 'directory', 'layer');
    const firstSet = buildSet(0, 'src/_domain', true);
    const secondSet = buildSet(1, 'src/_domain', true);
    const model = buildModel([firstSet, secondSet], [], [parent]);

    expect(verifyHorizontalHierarchies(model)).toEqual([]);
  });

  describe('conflicts produce horizontal-hierarchy-overlap', () => {
    it('reports an overlap conflict between general and local hierarchies', () => {
      const child = createClassification(
        2,
        'src/_types',
        'directory',
        'category'
      );
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 2,
      };
      const model = buildModel([], [conflict], [child]);

      expect(verifyHorizontalHierarchies(model)).toEqual([
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

    it('reports an overlap conflict between two local hierarchies', () => {
      const child = createClassification(
        5,
        'src/main.ts',
        'file',
        null,
        'root-node'
      );
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [1, 2],
        itemId: 5,
      };
      const model = buildModel([], [conflict], [child]);

      expect(verifyHorizontalHierarchies(model)).toEqual([
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
  });

  it('reports both members and overlap outcomes ordered by constraint and element', () => {
    const parent = createClassification(
      1,
      'src/z',
      'directory',
      'root-fragment'
    );
    const childA = createClassification(
      2,
      'src/a.ts',
      'file',
      null,
      'root-node'
    );
    const childB = createClassification(
      3,
      'src/b.ts',
      'file',
      null,
      'root-node'
    );

    const set = buildSet(0, 'src/z', false);
    const conflicts: readonly THorizontalHierarchyConflict[] = [
      { hierarchyIds: [0, 1], itemId: 3 },
      { hierarchyIds: [0, 1], itemId: 2 },
    ];

    const model = buildModel([set], conflicts, [parent, childA, childB]);

    expect(verifyHorizontalHierarchies(model)).toEqual([
      {
        constraint: 'classification/horizontal-hierarchy-members',
        element: 'src/z',
        family: 'classification',
        message:
          "'src/z' has a Horizontal Hierarchy over children that FAF does not allow to be ordered",
        normativeReference: 'FAF §6.9',
      },
      {
        constraint: 'classification/horizontal-hierarchy-overlap',
        element: 'src/a.ts',
        family: 'classification',
        message: "'src/a.ts' is selected by more than one Horizontal Hierarchy",
        normativeReference: 'FAF §4',
      },
      {
        constraint: 'classification/horizontal-hierarchy-overlap',
        element: 'src/b.ts',
        family: 'classification',
        message: "'src/b.ts' is selected by more than one Horizontal Hierarchy",
        normativeReference: 'FAF §4',
      },
    ]);
  });

  describe('deduplication', () => {
    it('deduplicates multiple non-orderable applications under the same parent', () => {
      const parent = createClassification(
        1,
        'src',
        'directory',
        'root-fragment'
      );
      const firstParentSet = buildSet(0, 'src', false);
      const secondParentSet = buildSet(1, 'src', false);
      const model = buildModel([firstParentSet, secondParentSet], [], [parent]);

      const outcomes = verifyHorizontalHierarchies(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.element).toBe('src');
    });

    it('deduplicates multiple conflict entries for the same child element', () => {
      const child = createClassification(
        2,
        'src/shared.ts',
        'file',
        null,
        'root-node'
      );
      const conflictA: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 2,
      };
      const conflictB: THorizontalHierarchyConflict = {
        hierarchyIds: [2, 3],
        itemId: 2,
      };
      const model = buildModel([], [conflictA, conflictB], [child]);

      const outcomes = verifyHorizontalHierarchies(model);
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0]?.element).toBe('src/shared.ts');
    });
  });

  describe('unclassified elements are ignored', () => {
    it('ignores non-orderable applications where the parent directory has null domainKind', () => {
      const unclassifiedParent = createClassification(
        1,
        'src/unclassified',
        'directory',
        null
      );
      const set = buildSet(0, 'src/unclassified', false);
      const model = buildModel([set], [], [unclassifiedParent]);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });

    it('ignores non-orderable applications where the parent is not in taxonomy', () => {
      const set = buildSet(0, 'src/missing', false);
      const model = buildModel([set], [], []);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });

    it('ignores non-orderable applications where parent is a file with null nodeKind', () => {
      const unclassifiedFile = createClassification(
        1,
        'src/mystery.ts',
        'file',
        null,
        null
      );
      const set = buildSet(0, 'src/mystery.ts', false);
      const model = buildModel([set], [], [unclassifiedFile]);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });

    it('ignores conflicts where the child file has null nodeKind', () => {
      const unclassifiedChild = createClassification(
        2,
        'src/unknown.ts',
        'file',
        null,
        null
      );
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 2,
      };
      const model = buildModel([], [conflict], [unclassifiedChild]);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });

    it('ignores conflicts where the child directory has null domainKind', () => {
      const unclassifiedChild = createClassification(
        2,
        'src/unknown-dir',
        'directory',
        null
      );
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 2,
      };
      const model = buildModel([], [conflict], [unclassifiedChild]);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });

    it('ignores conflicts where the child is not found in taxonomy', () => {
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 999,
      };
      const model = buildModel([], [conflict], []);

      expect(verifyHorizontalHierarchies(model)).toEqual([]);
    });
  });

  describe('determinism under permutation', () => {
    it('produces identical outcomes regardless of sets and conflicts order', () => {
      const parentA = createClassification(1, 'src/a', 'directory', 'layer');
      const parentB = createClassification(2, 'src/b', 'directory', 'layer');
      const childC = createClassification(3, 'src/c', 'directory', 'category');
      const childD = createClassification(4, 'src/d', 'directory', 'category');

      const setsAscending: readonly THorizontalHierarchySet[] = [
        buildSet(0, 'src/a', false),
        buildSet(1, 'src/b', false),
      ];
      const setsDescending: readonly THorizontalHierarchySet[] = [
        buildSet(1, 'src/b', false),
        buildSet(0, 'src/a', false),
      ];

      const conflictsAscending: readonly THorizontalHierarchyConflict[] = [
        { hierarchyIds: [0, 1], itemId: 3 },
        { hierarchyIds: [0, 1], itemId: 4 },
      ];
      const conflictsDescending: readonly THorizontalHierarchyConflict[] = [
        { hierarchyIds: [0, 1], itemId: 4 },
        { hierarchyIds: [0, 1], itemId: 3 },
      ];

      const classifications = [parentA, parentB, childC, childD];

      const outcomesA = verifyHorizontalHierarchies(
        buildModel(setsAscending, conflictsAscending, classifications)
      );
      const outcomesB = verifyHorizontalHierarchies(
        buildModel(setsDescending, conflictsDescending, classifications)
      );

      expect(outcomesA).toEqual(outcomesB);
      expect(outcomesA.map((o) => o.element)).toEqual([
        'src/a',
        'src/b',
        'src/c',
        'src/d',
      ]);
    });
  });

  describe('absence of mutation', () => {
    it('does not mutate the verification model', () => {
      const parent = createClassification(
        1,
        'src/_utils/widget',
        'directory',
        'fragment'
      );
      const child = createClassification(
        2,
        'src/_types',
        'directory',
        'category'
      );
      const set = buildSet(0, 'src/_utils/widget', false);
      const conflict: THorizontalHierarchyConflict = {
        hierarchyIds: [0, 1],
        itemId: 2,
      };

      const model = buildModel([set], [conflict], [parent, child]);
      const snapshot = JSON.stringify(model);

      verifyHorizontalHierarchies(model);

      expect(JSON.stringify(model)).toBe(snapshot);
    });
  });
});
