import { describe, expect, it } from 'vitest';

import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { checkEdgeExternalDependency } from './index.js';

type TGraphVertexEntry = {
  readonly nature: TVertexNature;
  readonly path: string;
};

type TItemEntry = {
  readonly id: number;
  readonly nodeKind: null | TNodeKind;
  readonly path: string;
  readonly treeOrigin?: null | string;
};

const createEdge = (from: string, to: string): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath: from,
  specifier: '../outside.js',
  syntaxKind: 'side-effect-import',
});

const createTestContext = (
  itemEntries: readonly TItemEntry[],
  vertexEntries: readonly TGraphVertexEntry[]
): {
  readonly graph: TDependencyGraph;
  readonly inventory: TInventory;
  readonly taxonomy: TTaxonomyModel;
} => {
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const entry of itemEntries) {
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
      treeOrigin: entry.treeOrigin === undefined ? 'src' : entry.treeOrigin,
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

  const pathToVertex = new Map<string, number>();
  const vertexNatures: TVertexNature[] = [];
  const vertexToPath: string[] = [];

  for (const [index, vertex] of vertexEntries.entries()) {
    pathToVertex.set(vertex.path, index);
    vertexNatures.push(vertex.nature);
    vertexToPath.push(vertex.path);
  }

  const graph: TDependencyGraph = {
    columnTargets: new Int32Array(0),
    edgeCount: 0,
    edgeMetadata: [],
    edgesBySourcePath: new Map(),
    libraryNotes: [],
    libraryNotesBySourcePath: new Map(),
    pathToVertex,
    rowOffsets: new Int32Array(0),
    vertexCount: vertexEntries.length,
    vertexNatures,
    vertexToPath,
  };

  return {
    graph,
    inventory: { items, pathToId, realPathToId },
    taxonomy: { byItemId, byPath, classifications },
  };
};

describe('checkEdgeExternalDependency', () => {
  const defaultItems: readonly TItemEntry[] = [
    { id: 0, nodeKind: 'root-node', path: 'src/high.ts', treeOrigin: 'src' },
    { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
  ];

  const defaultVertices: readonly TGraphVertexEntry[] = [
    {
      nature: { inventoryId: 0, kind: 'tree-node' },
      path: 'src/high.ts',
    },
    {
      nature: { kind: 'external-local-file' },
      path: 'outside.ts',
    },
  ];

  it('returns outcome when import is not authorized', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/high.ts', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toEqual({
      constraint: 'dependency/external-dependencies',
      element: 'src/high.ts',
      family: 'dependency',
      from: 'src/high.ts',
      importIndex: 0,
      message:
        "'src/high.ts' imports 'outside.ts' through '../outside.js': a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source",
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 1 },
      specifier: '../outside.js',
      to: 'outside.ts',
    });
  });

  it('returns undefined when import is authorized', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/high.ts', 'outside.ts');
    const authorizedPairs = new Set<string>(['src\0src/high.ts\0outside.ts']);

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns outcome when authorized for another node only', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/high.ts', 'outside.ts');
    const authorizedPairs = new Set<string>(['src\0src/low.ts\0outside.ts']);

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/external-dependencies');
  });

  it('returns outcome when authorized toward another path only', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/high.ts', 'outside.ts');
    const authorizedPairs = new Set<string>(['src\0src/high.ts\0other.ts']);

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeDefined();
    expect(outcome?.constraint).toBe('dependency/external-dependencies');
  });

  it('returns undefined for Access Node (excluded per FAF §7.3)', () => {
    const items: readonly TItemEntry[] = [
      {
        id: 0,
        nodeKind: 'access-node',
        path: 'src/_utils/widget/index.ts',
        treeOrigin: 'src',
      },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/_utils/widget/index.ts',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/_utils/widget/index.ts', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when destination vertex is missing from graph', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/high.ts', 'missing.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when destination is a tree node', () => {
    const items: readonly TItemEntry[] = [
      { id: 0, nodeKind: 'root-node', path: 'src/high.ts', treeOrigin: 'src' },
      { id: 1, nodeKind: 'root-node', path: 'src/low.ts', treeOrigin: 'src' },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/high.ts',
      },
      {
        nature: { inventoryId: 1, kind: 'tree-node' },
        path: 'src/low.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/high.ts', 'src/low.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source path is not in taxonomy', () => {
    const { graph, inventory } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const emptyTaxonomy: TTaxonomyModel = {
      byItemId: new Map(),
      byPath: new Map(),
      classifications: [],
    };
    const edge = createEdge('src/high.ts', 'outside.ts');
    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      emptyTaxonomy,
      new Set()
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source item is missing from inventory', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const emptyInventory: TInventory = {
      items: [],
      pathToId: inventory.pathToId,
      realPathToId: inventory.realPathToId,
    };
    const edge = createEdge('src/high.ts', 'outside.ts');
    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      emptyInventory,
      taxonomy,
      new Set()
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source vertex is missing from graph', () => {
    const { graph, inventory, taxonomy } = createTestContext(
      defaultItems,
      defaultVertices
    );
    const edge = createEdge('src/missing.ts', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source vertex nature is external-local-file even if inventory has treeOrigin', () => {
    const items: readonly TItemEntry[] = [
      { id: 0, nodeKind: 'root-node', path: 'src/file.ts', treeOrigin: 'src' },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { kind: 'external-local-file' },
        path: 'src/file.ts',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/file.ts', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source classification is missing or nodeKind is null', () => {
    const items: readonly TItemEntry[] = [
      { id: 0, nodeKind: null, path: 'src/directory', treeOrigin: 'src' },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/directory',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/directory', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source is a foreign node', () => {
    const items: readonly TItemEntry[] = [
      {
        id: 0,
        nodeKind: 'foreign-node',
        path: 'src/README.md',
        treeOrigin: 'src',
      },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/README.md',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/README.md', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it('returns undefined when source item treeOrigin is null or not string', () => {
    const items: readonly TItemEntry[] = [
      { id: 0, nodeKind: 'root-node', path: 'src/high.ts', treeOrigin: null },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/high.ts',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/high.ts', 'outside.ts');
    const authorizedPairs = new Set<string>();

    const outcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      authorizedPairs
    );

    expect(outcome).toBeUndefined();
  });

  it.each([
    'master-node',
    'fragment-node',
    'category-node',
    'sub-graph-node',
    'unauthorized-logical-node',
  ] as const)('evaluates authorization for nodeKind %s', (nodeKind) => {
    const items: readonly TItemEntry[] = [
      { id: 0, nodeKind, path: 'src/node.ts', treeOrigin: 'src' },
      { id: 1, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TGraphVertexEntry[] = [
      {
        nature: { inventoryId: 0, kind: 'tree-node' },
        path: 'src/node.ts',
      },
      {
        nature: { kind: 'external-local-file' },
        path: 'outside.ts',
      },
    ];
    const { graph, inventory, taxonomy } = createTestContext(items, vertices);
    const edge = createEdge('src/node.ts', 'outside.ts');

    const unauthorizedOutcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      new Set()
    );
    expect(unauthorizedOutcome?.constraint).toBe(
      'dependency/external-dependencies'
    );

    const authorizedOutcome = checkEdgeExternalDependency(
      edge,
      graph,
      inventory,
      taxonomy,
      new Set(['src\0src/node.ts\0outside.ts'])
    );
    expect(authorizedOutcome).toBeUndefined();
  });
});
