import { describe, expect, it } from 'vitest';

import { hierarchyFixture } from './_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { deriveHorizontalHierarchies } from './derive-horizontal-hierarchies.util.js';

describe('deriveHorizontalHierarchies', () => {
  it('returns empty models without outcomes for an empty project', () => {
    const { basis, taxonomy } = hierarchyFixture([]);
    expect(
      deriveHorizontalHierarchies(
        { ...basis, declarations: { ...basis.declarations, trees: [] } },
        taxonomy
      )
    ).toEqual({
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
        { domainKind: 'category', path: 'src/_src@shared/_domain/_utils' },
        {
          domainKind: 'sub-category',
          path: 'src/_src@shared/_domain/_utils/_primitives',
        },
        {
          domainKind: 'sub-category',
          path: 'src/_src@shared/_domain/_utils/_compounds',
        },
        {
          domainKind: 'fragment',
          path: 'src/_src@shared/_domain/_utils/_primitives/widget',
        },
        {
          fragmentInternalRank: 7,
          nodeKind: 'master-node',
          path: 'src/_src@shared/_domain/_utils/_primitives/widget/widget.util.ts',
        },
        {
          fragmentInternalRank: 8,
          nodeKind: 'access-node',
          path: 'src/_src@shared/_domain/_utils/_primitives/widget/index.ts',
        },
      ],
      {
        horizontalHierarchies: [
          {
            hierarchy: [['_domain'], ['_runtime']],
            path: 'src/_src@shared',
          },
        ],
        horizontalHierarchyModels: [
          [['_primitives'], ['_missing'], ['_compounds']],
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
            origin: 'horizontal-hierarchy',
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
            origin: 'horizontal-hierarchy-model',
            parentPath: 'src/_src@shared/_domain/_utils',
            repetitions: [],
            siblings: [
              { itemId: 6, rank: 0 },
              { itemId: 7, rank: 2 },
            ],
          },
          {
            id: 3,
            isOrderable: true,
            origin: 'fragment-internal',
            parentPath: 'src/_src@shared/_domain/_utils/_primitives/widget',
            repetitions: [],
            siblings: [
              { itemId: 9, rank: 7 },
              { itemId: 10, rank: 8 },
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
          { hierarchy: [['_missing', '_c'], ['_d']], path: 'src' },
          { hierarchy: [['_a'], ['_b', '_missing']], path: 'src' },
        ],
      }
    );
    const result = deriveHorizontalHierarchies(basis, taxonomy);
    expect(result.hierarchies.conflicts).toEqual([]);
    expect(result.hierarchies.sets).toEqual([
      {
        id: 0,
        isOrderable: true,
        origin: 'horizontal-hierarchy',
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
        origin: 'horizontal-hierarchy',
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

  it('captures overlap conflicts between horizontalHierarchyModels and horizontalHierarchies and between same-origin sets', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'category', path: 'src/_utils' },
        { domainKind: 'sub-category', path: 'src/_utils/_a' },
        { domainKind: 'sub-category', path: 'src/_utils/_b' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_a', '_b'], ['_missing']], path: 'src/_utils' },
          { hierarchy: [['_a'], ['_other']], path: 'src/_utils' },
        ],
        horizontalHierarchyModels: [
          [['_a'], ['_a']],
          [['_a'], ['_b']],
        ],
      }
    );
    const result = deriveHorizontalHierarchies(basis, taxonomy);
    expect(result.hierarchies.conflicts).toEqual([
      { hierarchyIds: [0, 1, 2, 3], itemId: 1 },
      { hierarchyIds: [0, 3], itemId: 2 },
    ]);
    expect(result.hierarchies.sets[2]?.repetitions).toEqual(['_a']);
    expect(result.outcomes).toEqual([]);
  });

  it('records non-orderable domain applications under ineligible parents without emitting outcomes', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        {
          domainKind: 'category',
          path: 'src/_types',
          relationalQualifications: { isPrivateCategory: true },
        },
        { domainKind: 'fractal-branch', path: 'src/_src@shared' },
        { domainKind: 'category', path: 'src/_src@shared/_types' },
        { domainKind: 'layer', path: 'src/_src@shared/_domain' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_types'], ['_src@shared']], path: 'src' },
          {
            hierarchy: [['_types'], ['_domain']],
            path: 'src/_src@shared',
          },
        ],
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
    ).toEqual([
      {
        id: 0,
        isOrderable: false,
        origin: 'horizontal-hierarchy',
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
        origin: 'root-nodes',
        parentPath: 'src',
        repetitions: [],
        siblings: [],
      },
      {
        id: 2,
        isOrderable: false,
        origin: 'horizontal-hierarchy',
        parentPath: 'src/_src@shared',
        repetitions: [],
        siblings: [
          { itemId: 3, rank: 0 },
          { itemId: 4, rank: 1 },
        ],
      },
    ]);
    expect(deriveHorizontalHierarchies(basis, taxonomy).outcomes).toEqual([]);
  });

  it('applies horizontalHierarchyModels only to Category and Sub-Category parents and horizontalHierarchies only at target path', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_b' },
        { domainKind: 'category', path: 'src/_a/_utils' },
        {
          domainKind: 'sub-category',
          path: 'src/_a/_utils/_primitives',
        },
        {
          domainKind: 'sub-category',
          path: 'src/_a/_utils/_primitives/_compounds',
        },
        { domainKind: 'category', path: 'src/_b/_types' },
        { domainKind: 'category', path: 'src/_b/_utils' },
        {
          domainKind: 'category',
          path: 'src/_b/_routes',
          relationalQualifications: { isParentCategory: true },
        },
        {
          domainKind: 'path-sub-category',
          path: 'src/_b/_routes/_compounds',
        },
        { domainKind: 'foreign-domain', path: 'src/_foreign' },
        { domainKind: 'sub-category', path: 'src/_foreign/_compounds' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_types'], ['_utils']], path: 'src/_a' },
          { hierarchy: [['_types'], ['_utils']], path: 'src/_b' },
        ],
        horizontalHierarchyModels: [[['_primitives'], ['_compounds']]],
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
      ['src/_a', 'horizontal-hierarchy', [{ itemId: 3, rank: 1 }]],
      ['src/_a/_utils', 'horizontal-hierarchy-model', [{ itemId: 4, rank: 0 }]],
      [
        'src/_a/_utils/_primitives',
        'horizontal-hierarchy-model',
        [{ itemId: 5, rank: 1 }],
      ],
      [
        'src/_b',
        'horizontal-hierarchy',
        [
          { itemId: 6, rank: 0 },
          { itemId: 7, rank: 1 },
        ],
      ],
    ]);
    expect(result.outcomes).toEqual([]);
  });

  it('preserves distinct identical applications as conflicts and ignores items outside declared Trees', () => {
    const { basis, taxonomy } = hierarchyFixture(
      [
        { domainKind: 'root-layer', path: 'src' },
        { domainKind: 'layer', path: 'src/_a' },
        { domainKind: 'layer', path: 'src/_b' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_a'], ['_b']], path: 'src' },
          { hierarchy: [['_a'], ['_b']], path: 'src' },
        ],
      }
    );
    expect(
      deriveHorizontalHierarchies(basis, taxonomy).hierarchies.conflicts
    ).toEqual([
      { hierarchyIds: [0, 1], itemId: 1 },
      { hierarchyIds: [0, 1], itemId: 2 },
    ]);
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
          { hierarchy: [['b.ts'], ['a.ts']], path: 'src' },
          { hierarchy: [['b.ts'], ['a.ts']], path: 'src' },
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
        { domainKind: 'category', path: 'src' },
        { domainKind: 'sub-category', path: 'src/_z' },
        { domainKind: 'sub-category', path: 'src/_a' },
        { domainKind: 'sub-category', path: 'src/_empty' },
      ],
      {
        horizontalHierarchies: [
          { hierarchy: [['_z'], ['_empty']], path: 'src' },
          { hierarchy: [['_a'], ['_empty']], path: 'src' },
        ],
        horizontalHierarchyModels: [
          [['_z', '_a'], ['_other']],
          [['_a'], ['_other']],
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
      const horizontalHierarchies = [...tree.horizontalHierarchies];
      horizontalHierarchies.reverse();
      return {
        ...tree,
        horizontalHierarchies,
        horizontalHierarchyModels: [
          [['_a'], ['_other']],
          [['_z', '_a'], ['_other']],
        ] as const,
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
