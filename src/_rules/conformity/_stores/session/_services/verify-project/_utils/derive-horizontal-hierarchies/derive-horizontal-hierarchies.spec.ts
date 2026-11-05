import { describe, expect, it } from 'vitest';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { hierarchyFixture } from './_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { deriveHorizontalHierarchies } from './index.js';

describe('deriveHorizontalHierarchies', () => {
  it('returns empty models without outcomes for an empty project', () => {
    const model = verificationModel();
    expect(deriveHorizontalHierarchies(model.basis, model.taxonomy)).toEqual({
      hierarchies: { conflicts: [], sets: [] },
      outcomes: [],
    });
  });

  it('derives all four hierarchy origins in one model with independent identities', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        { nodeKind: 'root-node', path: 'src/main.ts' },
        { domainKind: 'fractal-branch', path: 'src/_src@shared' },
        { domainKind: 'layer', path: 'src/_src@shared/_domain' },
        { domainKind: 'layer', path: 'src/_src@shared/_runtime' },
        { domainKind: 'category', path: 'src/_src@shared/_domain/_types' },
        { domainKind: 'category', path: 'src/_src@shared/_domain/_utils' },
        {
          domainKind: 'fragment',
          path: 'src/_src@shared/_domain/_utils/widget',
        },
        {
          fragmentInternalRank: 7,
          nodeKind: 'master-node',
          path: 'src/_src@shared/_domain/_utils/widget/widget.util.ts',
        },
        {
          fragmentInternalRank: 8,
          nodeKind: 'access-node',
          path: 'src/_src@shared/_domain/_utils/widget/index.ts',
        },
      ],
      {
        horizontalHierarchies: [[['_types'], ['_missing'], ['_utils']]],
        localHorizontalHierarchies: [
          {
            hierarchy: [['_domain'], ['_runtime']],
            paths: ['src/_src@shared'],
          },
        ],
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'main.ts', rank: 0 }],
            subRootFragments: [],
          },
        ],
      }
    );
    expect(deriveHorizontalHierarchies(basis, taxonomy)).toEqual({
      hierarchies: {
        conflicts: [],
        sets: [
          {
            id: 0,
            isOrderable: true,
            origin: 'root-nodes',
            parentPath: 'src',
            repetitions: [],
            siblings: [{ itemId: 1, rank: 0 }],
          },
          {
            id: 1,
            isOrderable: true,
            origin: 'local',
            parentPath: 'src/_src@shared',
            repetitions: [],
            siblings: [
              { itemId: 3, rank: 0 },
              { itemId: 4, rank: 1 },
            ],
          },
          {
            id: 2,
            isOrderable: true,
            origin: 'general',
            parentPath: 'src/_src@shared/_domain',
            repetitions: [],
            siblings: [
              { itemId: 5, rank: 0 },
              { itemId: 6, rank: 2 },
            ],
          },
          {
            id: 3,
            isOrderable: true,
            origin: 'fragment-internal',
            parentPath: 'src/_src@shared/_domain/_utils/widget',
            repetitions: [],
            siblings: [
              { itemId: 8, rank: 7 },
              { itemId: 9, rank: 8 },
            ],
          },
        ],
      },
      outcomes: [],
    });
  });

  it('keeps disjoint applications separate even when they share absent names', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_b' },
        { domainKind: 'layer', path: 'src/_c' },
        { domainKind: 'layer', path: 'src/_d' },
      ],
      {
        horizontalHierarchies: [
          [['_missing', '_c'], ['_d']],
          [['_a'], ['_b', '_missing']],
        ],
      }
    );
    const result = deriveHorizontalHierarchies(basis, taxonomy);
    expect(result.hierarchies.conflicts).toEqual([]);
    expect(result.hierarchies.sets).toEqual([
      {
        id: 0,
        isOrderable: true,
        origin: 'general',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
      {
        id: 1,
        isOrderable: true,
        origin: 'general',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 3, rank: 0 },
          { itemId: 4, rank: 1 },
        ],
      },
    ]);
    expect(result.outcomes).toEqual([]);
  });

  it('records all conflicting hierarchy identities without precedence or duplicate self-conflicts', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_b' },
      ],
      {
        horizontalHierarchies: [[['_a'], ['_a']], [['_a', '_b']]],
        localHorizontalHierarchies: [
          { hierarchy: [['_a', '_b']], paths: ['src'] },
          { hierarchy: [['_a']], paths: ['src'] },
        ],
      }
    );
    const result = deriveHorizontalHierarchies(basis, taxonomy);
    expect(result.hierarchies.conflicts).toEqual([
      { hierarchyIds: [0, 1, 2, 3], itemId: 1 },
      { hierarchyIds: [1, 2], itemId: 2 },
    ]);
    expect(result.hierarchies.sets[0]?.repetitions).toEqual(['_a']);
    expect(result.outcomes).toEqual([]);
  });

  it('records applications under an ineligible parent without emitting violations', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        {
          domainKind: 'category',
          path: 'src/_types',
          relationalQualifications: { isPrivateCategory: true },
        },
      ],
      {
        horizontalHierarchies: [[['_types']]],
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [],
            subRootFragments: [],
          },
        ],
      }
    );
    expect(
      deriveHorizontalHierarchies(basis, taxonomy).hierarchies.sets
    ).toContainEqual({
      id: 0,
      isOrderable: false,
      origin: 'general',
      parentPath: 'src',
      repetitions: [],
      siblings: [{ itemId: 1, rank: 0 }],
    });
    expect(deriveHorizontalHierarchies(basis, taxonomy).outcomes).toEqual([]);
  });

  it('applies general models per parent and local models only at the selected level', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_b' },
        { domainKind: 'category', path: 'src/_a/_types' },
        { domainKind: 'category', path: 'src/_b/_types' },
        { domainKind: 'category', path: 'src/_b/_utils' },
        { domainKind: 'sub-category', path: 'src/_a/_types/_types' },
        { domainKind: 'foreign-domain', path: 'src/_foreign' },
        { domainKind: 'foreign-domain', path: 'src/_foreign/_types' },
      ],
      {
        horizontalHierarchies: [[['_absent'], ['_types']]],
        localHorizontalHierarchies: [
          { hierarchy: [['_utils']], paths: ['src/_a', 'src/_b'] },
        ],
      }
    );
    const result = deriveHorizontalHierarchies(basis, taxonomy);
    expect(result.hierarchies.conflicts).toEqual([]);
    expect(
      result.hierarchies.sets.map((set) => [
        set.parentPath,
        set.origin,
        set.siblings,
      ])
    ).toEqual([
      ['src/_a', 'general', [{ itemId: 3, rank: 1 }]],
      ['src/_a', 'local', []],
      ['src/_a/_types', 'general', [{ itemId: 6, rank: 1 }]],
      ['src/_b', 'general', [{ itemId: 4, rank: 1 }]],
      ['src/_b', 'local', [{ itemId: 5, rank: 0 }]],
    ]);
    expect(result.outcomes).toEqual([]);
  });

  it('preserves distinct identical applications as conflicts and ignores items outside declared Trees', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
      ],
      { horizontalHierarchies: [[['_a']], [['_a']]] }
    );
    expect(
      deriveHorizontalHierarchies(basis, taxonomy).hierarchies.conflicts
    ).toEqual([{ hierarchyIds: [0, 1], itemId: 1 }]);
    const inventory = {
      ...basis.inventory,
      items: basis.inventory.items.map((item) => ({
        ...item,
        treeOrigin: null,
      })),
    };
    expect(
      deriveHorizontalHierarchies({ ...basis, inventory }, taxonomy)
    ).toEqual({ hierarchies: { conflicts: [], sets: [] }, outcomes: [] });
  });

  it('canonicalizes ranks, equal-rank identities and conflicts independently of inventory order', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        { nodeKind: 'root-node', path: 'src/a.ts' },
        { nodeKind: 'root-node', path: 'src/b.ts' },
        { nodeKind: 'root-node', path: 'src/c.ts' },
      ],
      {
        horizontalHierarchies: [
          [['b.ts'], ['a.ts']],
          [['b.ts'], ['a.ts']],
        ],
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [
              { name: 'c.ts', rank: 0 },
              { name: 'a.ts', rank: 9 },
              { name: 'b.ts', rank: 0 },
            ],
            subRootFragments: [],
          },
        ],
      }
    );
    const items = [...basis.inventory.items];
    items.reverse();
    const result = deriveHorizontalHierarchies(
      { ...basis, inventory: { ...basis.inventory, items } },
      taxonomy
    );
    expect(result.hierarchies.sets.map((set) => set.siblings)).toEqual([
      [
        { itemId: 2, rank: 0 },
        { itemId: 1, rank: 1 },
      ],
      [
        { itemId: 2, rank: 0 },
        { itemId: 1, rank: 1 },
      ],
      [
        { itemId: 2, rank: 0 },
        { itemId: 3, rank: 0 },
        { itemId: 1, rank: 9 },
      ],
    ]);
    expect(result.hierarchies.conflicts).toEqual([
      { hierarchyIds: [0, 1, 2], itemId: 1 },
      { hierarchyIds: [0, 1, 2], itemId: 2 },
    ]);
  });

  it('is pure and deterministic across inventory, taxonomy and declaration permutations', () => {
    const fixture = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_z' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_empty' },
      ],
      {
        horizontalHierarchies: [[['_z', '_a']], [['_a']]],
        localHorizontalHierarchies: [
          { hierarchy: [['_z']], paths: ['src'] },
          { hierarchy: [['_a']], paths: ['src'] },
        ],
      }
    );
    const before = structuredClone(fixture);
    const expected = deriveHorizontalHierarchies(
      fixture.basis,
      fixture.taxonomy
    );
    const items = [...fixture.basis.inventory.items];
    items.reverse();
    const classifications = [...fixture.taxonomy.classifications];
    classifications.reverse();
    const trees = fixture.basis.declarations.trees.map((tree) => {
      const localHorizontalHierarchies = [...tree.localHorizontalHierarchies];
      localHorizontalHierarchies.reverse();
      return {
        ...tree,
        horizontalHierarchies: [[['_a']], [['_a', '_z']]] as const,
        localHorizontalHierarchies,
      };
    });
    trees.reverse();
    const result = deriveHorizontalHierarchies(
      {
        ...fixture.basis,
        declarations: {
          ...fixture.basis.declarations,
          trees,
        },
        inventory: {
          ...fixture.basis.inventory,
          items,
        },
      },
      {
        ...fixture.taxonomy,
        byItemId: new Map(classifications.map((item) => [item.itemId, item])),
        byPath: new Map(classifications.map((item) => [item.path, item])),
        classifications,
      }
    );
    expect(result).toEqual(expected);
    expect(fixture).toEqual(before);
  });
});
