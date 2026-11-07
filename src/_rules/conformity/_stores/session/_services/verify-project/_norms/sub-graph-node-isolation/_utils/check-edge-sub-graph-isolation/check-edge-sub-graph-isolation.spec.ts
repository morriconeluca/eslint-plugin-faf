import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkEdgeSubGraphIsolation } from './check-edge-sub-graph-isolation.util.js';

type TItemEntry = {
  readonly id: number;
  readonly nodeKind: null | TNodeKind;
  readonly path: string;
};

const createInventoryAndTaxonomy = (
  entries: readonly TItemEntry[]
): { readonly inventory: TInventory; readonly taxonomy: TTaxonomyModel } => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const entry of entries) {
    const item: TInventoryItem = {
      depth: 1,
      id: entry.id,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: entry.path,
      preorderEnd: entry.id,
      preorderStart: entry.id,
      realPath: entry.path,
      treeOrigin: 'src',
    };
    items[entry.id] = item;
    pathToId.set(entry.path, entry.id);
    realPathToId.set(entry.path, entry.id);

    const classification: TItemClassification = {
      domainKind: null,
      entryKind: 'file',
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId: entry.id,
      nodeKind: entry.nodeKind,
      path: entry.path,
      relationalQualifications: {
        isParentCategory: false,
        isPathFragment: false,
        isPrivateCategory: false,
        isSubFragment: false,
        isSubLayer: false,
        parentFragmentPath: null,
      },
      role: { kind: 'absent', roleName: null },
    };
    byItemId.set(entry.id, classification);
    byPath.set(entry.path, classification);
    classifications.push(classification);
  }

  return {
    inventory: { items, pathToId, realPathToId },
    taxonomy: { byItemId, byPath, classifications },
  };
};

const createEdge = (
  sourcePath: string,
  destinationPath: string,
  specifier = './widget.spec.js',
  importIndex = 0
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

describe('checkEdgeSubGraphIsolation', () => {
  it('returns undefined when destination is not in inventory', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 1, nodeKind: 'master-node', path: 'src/main.ts' },
    ]);
    const edge = createEdge('src/main.ts', 'src/missing.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when destination classification is not in taxonomy', () => {
    const { inventory } = createInventoryAndTaxonomy([
      { id: 1, nodeKind: 'master-node', path: 'src/main.ts' },
      { id: 2, nodeKind: 'sub-graph-node', path: 'src/unit.spec.ts' },
    ]);
    const emptyTaxonomy: TTaxonomyModel = {
      byItemId: new Map(),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/main.ts', 'src/unit.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, emptyTaxonomy)
    ).toBeUndefined();
  });

  it.each([
    'master-node',
    'fragment-node',
    'access-node',
    'root-node',
    'category-node',
    'foreign-node',
    'unauthorized-logical-node',
    null,
  ] as const)(
    'returns undefined when destination nodeKind is %s (not sub-graph-node)',
    (nodeKind) => {
      const { inventory, taxonomy } = createInventoryAndTaxonomy([
        { id: 1, nodeKind: 'master-node', path: 'src/source.ts' },
        { id: 2, nodeKind, path: 'src/target.ts' },
      ]);
      const edge = createEdge('src/source.ts', 'src/target.ts');
      expect(
        checkEdgeSubGraphIsolation(edge, inventory, taxonomy)
      ).toBeUndefined();
    }
  );

  it('returns undefined when source is not in inventory', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 2, nodeKind: 'sub-graph-node', path: 'src/unit.spec.ts' },
    ]);
    const edge = createEdge('src/external.ts', 'src/unit.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when source classification is not in taxonomy', () => {
    const { inventory } = createInventoryAndTaxonomy([
      { id: 1, nodeKind: 'master-node', path: 'src/main.ts' },
      { id: 2, nodeKind: 'sub-graph-node', path: 'src/unit.spec.ts' },
    ]);
    const partialTaxonomy: TTaxonomyModel = {
      byItemId: new Map([
        [
          2,
          {
            domainKind: null,
            entryKind: 'file',
            fragmentInternalRank: null,
            imposedRoleName: null,
            itemId: 2,
            nodeKind: 'sub-graph-node',
            path: 'src/unit.spec.ts',
            relationalQualifications: {
              isParentCategory: false,
              isPathFragment: false,
              isPrivateCategory: false,
              isSubFragment: false,
              isSubLayer: false,
              parentFragmentPath: null,
            },
            role: { kind: 'absent', roleName: null },
          },
        ],
      ]),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/main.ts', 'src/unit.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, partialTaxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when source classification nodeKind is null', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 1, nodeKind: null, path: 'src/domain-dir' },
      { id: 2, nodeKind: 'sub-graph-node', path: 'src/unit.spec.ts' },
    ]);
    const edge = createEdge('src/domain-dir', 'src/unit.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it('returns undefined when source is a foreign-node', () => {
    const { inventory, taxonomy } = createInventoryAndTaxonomy([
      { id: 1, nodeKind: 'foreign-node', path: 'src/README.md' },
      { id: 2, nodeKind: 'sub-graph-node', path: 'src/unit.spec.ts' },
    ]);
    const edge = createEdge('src/README.md', 'src/unit.spec.ts');
    expect(
      checkEdgeSubGraphIsolation(edge, inventory, taxonomy)
    ).toBeUndefined();
  });

  it.each([
    'master-node',
    'fragment-node',
    'access-node',
    'sub-graph-node',
    'root-node',
    'category-node',
    'unauthorized-logical-node',
  ] as const)(
    'returns a dependency/sub-graph-node-isolation outcome when source is %s',
    (sourceKind) => {
      const sourcePath = 'src/consumer.ts';
      const destinationPath = 'src/unit.spec.ts';
      const specifier = './unit.spec.js';
      const { inventory, taxonomy } = createInventoryAndTaxonomy([
        { id: 1, nodeKind: sourceKind, path: sourcePath },
        { id: 2, nodeKind: 'sub-graph-node', path: destinationPath },
      ]);
      const edge = createEdge(sourcePath, destinationPath, specifier, 2);
      const outcome = checkEdgeSubGraphIsolation(edge, inventory, taxonomy);

      expect(outcome).toBeDefined();
      expect(outcome?.constraint).toBe('dependency/sub-graph-node-isolation');
      expect(outcome?.family).toBe('dependency');
      expect(outcome?.from).toBe('src/consumer.ts');
      expect(outcome?.to).toBe('src/unit.spec.ts');
      expect(outcome?.specifier).toBe('./unit.spec.js');
      expect(outcome?.importIndex).toBe(2);
      expect(outcome?.position).toEqual({ column: 1, line: 1 });
      expect(outcome?.element).toBe('src/consumer.ts');
      expect(outcome?.normativeReference).toBe('FAF §4');
      expect(outcome?.message).toBe(
        "'src/consumer.ts' imports 'src/unit.spec.ts' through './unit.spec.js': a Sub-Graph Node is not importable"
      );
    }
  );
});
