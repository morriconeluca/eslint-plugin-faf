import { describe, expect, it } from 'vitest';

import { hierarchyFixture } from '../../_derive-horizontal-hierarchies@shared/_mocks/hierarchy-fixture.mock.js';
import { deriveNodeHierarchies } from './index.js';

describe('deriveNodeHierarchies', () => {
  it('uses classified catalog ranks for Fragment Nodes and the shared top rank for entry nodes', () => {
    const { context } = hierarchyFixture([
      { domainKind: 'fragment', path: 'src/_utils/widget' },
      {
        fragmentInternalRank: 7,
        nodeKind: 'master-node',
        path: 'src/_utils/widget/widget.util.ts',
      },
      {
        fragmentInternalRank: 2,
        nodeKind: 'fragment-node',
        path: 'src/_utils/widget/widget.type.ts',
      },
      {
        fragmentInternalRank: 8,
        nodeKind: 'access-node',
        path: 'src/_utils/widget/index.ts',
      },
      {
        fragmentInternalRank: 8,
        nodeKind: 'sub-graph-node',
        path: 'src/_utils/widget/widget.spec.ts',
      },
      { nodeKind: 'foreign-node', path: 'src/_utils/widget/README.md' },
      { domainKind: 'category', path: 'src/_utils/widget/_types' },
    ]);
    expect(deriveNodeHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'fragment-internal',
        parentPath: 'src/_utils/widget',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 7 },
          { itemId: 2, rank: 2 },
          { itemId: 3, rank: 8 },
          { itemId: 4, rank: 8 },
        ],
      },
    ]);
    const classifiedEntries = [...context.taxonomy.byItemId].filter(
      ([id]) => id !== 2
    );
    const incomplete = {
      ...context,
      taxonomy: { ...context.taxonomy, byItemId: new Map(classifiedEntries) },
    };
    expect(deriveNodeHierarchies(incomplete)[0]?.siblings).not.toContainEqual({
      itemId: 2,
      rank: 2,
    });
  });

  it('derives the single Root Node hierarchy from declarations, not filename Roles or catalog ranks', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        { nodeKind: 'root-node', path: 'src/index.ts' },
        { nodeKind: 'root-node', path: 'src/main.spec.ts' },
        { nodeKind: 'foreign-node', path: 'src/README.md' },
      ],
      {
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [
              { name: 'index.ts', rank: 4 },
              { name: 'main.spec.ts', rank: 1 },
            ],
            subRootFragments: [],
          },
        ],
      }
    );
    expect(deriveNodeHierarchies(context)).toEqual([
      {
        isOrderable: true,
        origin: 'root-nodes',
        parentPath: 'src',
        repetitions: [],
        siblings: [
          { itemId: 1, rank: 4 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);
  });

  it('retains repeated Root selections and marks unclassified declared files as non-orderable', () => {
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src' },
        { nodeKind: 'root-node', path: 'src/a.ts' },
        { nodeKind: null, path: 'src/b.ts' },
      ],
      {
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [
              { name: 'b.ts', rank: 0 },
              { name: 'a.ts', rank: 0 },
              { name: 'b.ts', rank: 1 },
              { name: 'a.ts', rank: 1 },
            ],
            subRootFragments: [],
          },
        ],
      }
    );
    expect(deriveNodeHierarchies(context)).toEqual([
      {
        isOrderable: false,
        origin: 'root-nodes',
        parentPath: 'src',
        repetitions: ['a.ts', 'b.ts'],
        siblings: [
          { itemId: 1, rank: 0 },
          { itemId: 1, rank: 1 },
          { itemId: 2, rank: 0 },
          { itemId: 2, rank: 1 },
        ],
      },
    ]);
  });

  it('finds nested Root Fragment declarations without merging their ranks with ancestors', () => {
    const nested = {
      dependencyPairs: [],
      path: 'src/app',
      rootNodes: [{ name: 'page.ts', rank: 9 }],
      subRootFragments: [],
    };
    const { context } = hierarchyFixture(
      [
        { domainKind: 'root-fragment', path: 'src/app' },
        { nodeKind: 'root-node', path: 'src/app/page.ts' },
      ],
      {
        originKind: 'root-fragment',
        rootFragments: [
          {
            dependencyPairs: [],
            path: 'src',
            rootNodes: [{ name: 'page.ts', rank: 0 }],
            subRootFragments: [nested],
          },
        ],
      }
    );
    expect(deriveNodeHierarchies(context)[0]?.siblings).toEqual([
      { itemId: 1, rank: 9 },
    ]);
  });

  it('does not invent hierarchies without a classified node container or a matching Root declaration', () => {
    const { context } = hierarchyFixture([
      { domainKind: 'root-layer', path: 'src' },
    ]);
    expect(deriveNodeHierarchies(context)).toEqual([]);
    expect(
      deriveNodeHierarchies({
        ...context,
        taxonomy: { ...context.taxonomy, byItemId: new Map() },
      })
    ).toEqual([]);
    const { context: root } = hierarchyFixture(
      [{ domainKind: 'root-fragment', path: 'src' }],
      { originKind: 'root-fragment' }
    );
    expect(deriveNodeHierarchies(root)).toEqual([]);
  });
});
