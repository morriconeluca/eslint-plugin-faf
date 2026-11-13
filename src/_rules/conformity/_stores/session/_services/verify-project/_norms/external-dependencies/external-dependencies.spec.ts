import { describe, expect, it } from 'vitest';

import type { TSourceLocation } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TItemClassification,
  TNodeKind,
  TTaxonomyModel,
} from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type {
  TDependencyGraph,
  TEdgeMetadata,
  TLibraryNote,
  TVertexNature,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TEffectiveOrientedPair,
  TEffectiveTree,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { verificationModel } from '../../_verify-project@shared/_mocks/verification-model.mock.js';
import { verifyExternalDependencies } from './external-dependencies.norm.js';

type TModelItemSpec = {
  readonly id: number;
  readonly nodeKind: null | TNodeKind;
  readonly path: string;
  readonly treeOrigin?: null | string;
};

type TVertexSpec = {
  readonly nature: TVertexNature;
  readonly path: string;
};

const createTree = (
  originPath: string,
  externalDependencyPairs: readonly TEffectiveOrientedPair[] = []
): TEffectiveTree => ({
  catalog: {
    categoryToRole: new Map(),
    extensionToRole: new Map(),
    roles: [],
    subGraphRoles: [],
    topRank: 0,
  },
  externalDependencyPairs,
  foreignDomains: [],
  foreignNodes: { families: [], individualPaths: [] },
  horizontalHierarchies: [],
  localHorizontalHierarchies: [],
  mimeticPathStructures: [],
  originKind: 'root-fragment',
  originPath,
  publicRootNodes: [],
  rootFragments: [],
  treeDependencyPairs: [],
});

const DEFAULT_POSITION: TSourceLocation = { column: 1, line: 1 };

const createEdge = (
  from: string,
  to: string,
  specifier = '../outside.js',
  importIndex = 0,
  position: TSourceLocation = DEFAULT_POSITION
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath: to,
  importIndex,
  isTypeOnly: false,
  position,
  sourcePath: from,
  specifier,
  syntaxKind: 'side-effect-import',
});

const buildVerificationModel = (parameters: {
  readonly edges: readonly TEdgeMetadata[];
  readonly items: readonly TModelItemSpec[];
  readonly libraryNotes?: readonly TLibraryNote[];
  readonly trees: readonly TEffectiveTree[];
  readonly vertices: readonly TVertexSpec[];
}): TVerificationModel => {
  const base = verificationModel();

  const inventoryItems: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const byItemId = new Map<number, TItemClassification>();
  const byPath = new Map<string, TItemClassification>();
  const classifications: TItemClassification[] = [];

  for (const item of parameters.items) {
    const invItem: TInventoryItem = {
      depth: 1,
      id: item.id,
      isSymlink: false,
      kind: 'file',
      parentId: 0,
      path: item.path,
      preorderEnd: item.id,
      preorderStart: item.id,
      realPath: item.path,
      treeOrigin: item.treeOrigin === undefined ? 'src' : item.treeOrigin,
    };
    inventoryItems[item.id] = invItem;
    pathToId.set(item.path, item.id);
    realPathToId.set(item.path, item.id);

    const classification: TItemClassification = {
      domainKind: null,
      entryKind: 'file',
      fragmentInternalRank: null,
      imposedRoleName: null,
      itemId: item.id,
      nodeKind: item.nodeKind,
      path: item.path,
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
    byItemId.set(item.id, classification);
    byPath.set(item.path, classification);
    classifications.push(classification);
  }

  const inventory: TInventory = {
    items: inventoryItems,
    pathToId,
    realPathToId,
  };
  const taxonomy: TTaxonomyModel = { byItemId, byPath, classifications };

  const pathToVertex = new Map<string, number>();
  const vertexNatures: TVertexNature[] = [];
  const vertexToPath: string[] = [];

  for (const [index, vertex] of parameters.vertices.entries()) {
    pathToVertex.set(vertex.path, index);
    vertexNatures.push(vertex.nature);
    vertexToPath.push(vertex.path);
  }

  const graph: TDependencyGraph = {
    columnTargets: new Int32Array(0),
    edgeCount: parameters.edges.length,
    edgeMetadata: parameters.edges,
    edgesBySourcePath: new Map(),
    libraryNotes: parameters.libraryNotes ?? [],
    libraryNotesBySourcePath: new Map(),
    pathToVertex,
    rowOffsets: new Int32Array(0),
    vertexCount: parameters.vertices.length,
    vertexNatures,
    vertexToPath,
  };

  return {
    ...base,
    basis: {
      ...base.basis,
      declarations: {
        ...base.basis.declarations,
        trees: parameters.trees,
      },
      inventory,
    },
    graph,
    taxonomy,
  };
};

describe('verifyExternalDependencies', () => {
  const commonItems: readonly TModelItemSpec[] = [
    { id: 0, nodeKind: 'root-node', path: 'src/high.ts', treeOrigin: 'src' },
    { id: 1, nodeKind: 'root-node', path: 'src/low.ts', treeOrigin: 'src' },
    {
      id: 2,
      nodeKind: 'access-node',
      path: 'src/_utils/widget/index.ts',
      treeOrigin: 'src',
    },
    {
      id: 3,
      nodeKind: 'master-node',
      path: 'src/_utils/widget/widget.util.ts',
      treeOrigin: 'src',
    },
    {
      id: 4,
      nodeKind: 'category-node',
      path: 'src/_types/adapter.type.ts',
      treeOrigin: 'src',
    },
    { id: 5, nodeKind: 'root-node', path: 'src/main.ts', treeOrigin: 'src' },
    { id: 6, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    { id: 7, nodeKind: null, path: 'other.ts', treeOrigin: null },
  ];

  const commonVertices: readonly TVertexSpec[] = [
    { nature: { inventoryId: 0, kind: 'tree-node' }, path: 'src/high.ts' },
    { nature: { inventoryId: 1, kind: 'tree-node' }, path: 'src/low.ts' },
    {
      nature: { inventoryId: 2, kind: 'tree-node' },
      path: 'src/_utils/widget/index.ts',
    },
    {
      nature: { inventoryId: 3, kind: 'tree-node' },
      path: 'src/_utils/widget/widget.util.ts',
    },
    {
      nature: { inventoryId: 4, kind: 'tree-node' },
      path: 'src/_types/adapter.type.ts',
    },
    { nature: { inventoryId: 5, kind: 'tree-node' }, path: 'src/main.ts' },
    { nature: { kind: 'external-local-file' }, path: 'outside.ts' },
    { nature: { kind: 'external-local-file' }, path: 'other.ts' },
  ];

  it('forbids external local import without authorization', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts')],
      items: commonItems,
      trees: [createTree('src', [])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
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

  it('admits authorized external local import from a non-Access Node', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts')],
      items: commonItems,
      trees: [createTree('src', [{ from: 'src/high.ts', to: 'outside.ts' }])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toEqual([]);
  });

  it('forbids external local import authorized for another node only', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts')],
      items: commonItems,
      trees: [createTree('src', [{ from: 'src/low.ts', to: 'outside.ts' }])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual(
      expect.objectContaining({
        constraint: 'dependency/external-dependencies',
        from: 'src/high.ts',
      })
    );
  });

  it('forbids external local import authorized toward a different path only', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts')],
      items: commonItems,
      trees: [createTree('src', [{ from: 'src/high.ts', to: 'other.ts' }])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual(
      expect.objectContaining({
        constraint: 'dependency/external-dependencies',
        to: 'outside.ts',
      })
    );
  });

  it('excludes Access Node from external dependencies (FAF §7.3)', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/_utils/widget/index.ts', 'outside.ts')],
      items: commonItems,
      trees: [
        createTree('src', [
          { from: 'src/_utils/widget/index.ts', to: 'outside.ts' },
        ]),
      ],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toEqual([]);
  });

  it('adversarial: external library and workspace package in the same file', () => {
    const libraryNote: TLibraryNote = {
      aliasAlternatives: [],
      aliasUsed: null,
      importIndex: 1,
      isTypeOnly: false,
      packageName: 'node:path',
      position: { column: 1, line: 2 },
      sourcePath: 'src/high.ts',
      specifier: 'node:path',
      syntaxKind: 'side-effect-import',
    };

    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts', '#workspace', 0)],
      items: commonItems,
      libraryNotes: [libraryNote],
      trees: [createTree('src', [])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'dependency/external-dependencies',
      element: 'src/high.ts',
      family: 'dependency',
      from: 'src/high.ts',
      importIndex: 0,
      message:
        "'src/high.ts' imports 'outside.ts' through '#workspace': a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source",
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 1 },
      specifier: '#workspace',
      to: 'outside.ts',
    });
  });

  it('adversarial: Fragment adapter authorized while caller is not', () => {
    const model = buildVerificationModel({
      edges: [
        createEdge('src/main.ts', 'outside.ts', '../outside.js', 1, {
          column: 1,
          line: 2,
        }),
        createEdge(
          'src/_utils/widget/widget.util.ts',
          'outside.ts',
          '../../../outside.js',
          0,
          { column: 1, line: 1 }
        ),
      ],
      items: commonItems,
      trees: [
        createTree('src', [
          { from: 'src/_utils/widget/widget.util.ts', to: 'outside.ts' },
        ]),
      ],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'dependency/external-dependencies',
      element: 'src/main.ts',
      family: 'dependency',
      from: 'src/main.ts',
      importIndex: 1,
      message:
        "'src/main.ts' imports 'outside.ts' through '../outside.js': a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source",
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 2 },
      specifier: '../outside.js',
      to: 'outside.ts',
    });
  });

  it('adversarial: Category Node adapter authorized while caller is not', () => {
    const model = buildVerificationModel({
      edges: [
        createEdge('src/main.ts', 'outside.ts', '../outside.js', 1, {
          column: 1,
          line: 2,
        }),
        createEdge(
          'src/_types/adapter.type.ts',
          'outside.ts',
          '../../outside.js',
          0,
          { column: 1, line: 1 }
        ),
      ],
      items: commonItems,
      trees: [
        createTree('src', [
          { from: 'src/_types/adapter.type.ts', to: 'outside.ts' },
        ]),
      ],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual({
      constraint: 'dependency/external-dependencies',
      element: 'src/main.ts',
      family: 'dependency',
      from: 'src/main.ts',
      importIndex: 1,
      message:
        "'src/main.ts' imports 'outside.ts' through '../outside.js': a local file outside all Fractal Trees is importable only with an externalDependencies authorization of this source",
      normativeReference: 'FAF §7.3',
      position: { column: 1, line: 2 },
      specifier: '../outside.js',
      to: 'outside.ts',
    });
  });

  it('enforces multiple trees: Tree A authorization does not authorize Tree B egress', () => {
    const multiTreeItems: readonly TModelItemSpec[] = [
      { id: 0, nodeKind: 'root-node', path: 'app/main.ts', treeOrigin: 'app' },
      { id: 1, nodeKind: 'root-node', path: 'lib/main.ts', treeOrigin: 'lib' },
      { id: 2, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const multiTreeVertices: readonly TVertexSpec[] = [
      { nature: { inventoryId: 0, kind: 'tree-node' }, path: 'app/main.ts' },
      { nature: { inventoryId: 1, kind: 'tree-node' }, path: 'lib/main.ts' },
      { nature: { kind: 'external-local-file' }, path: 'outside.ts' },
    ];

    const model = buildVerificationModel({
      edges: [createEdge('lib/main.ts', 'outside.ts')],
      items: multiTreeItems,
      trees: [
        createTree('app', [{ from: 'lib/main.ts', to: 'outside.ts' }]),
        createTree('lib', []),
      ],
      vertices: multiTreeVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]).toEqual(
      expect.objectContaining({
        from: 'lib/main.ts',
      })
    );
  });

  it('guarantees deterministic ordering under edge permutation', () => {
    const edgeA = createEdge('src/a.ts', 'outside.ts', './out.js', 0, {
      column: 1,
      line: 1,
    });
    const edgeB = createEdge('src/b.ts', 'outside.ts', './out.js', 0, {
      column: 1,
      line: 1,
    });
    const edgeC = createEdge('src/b.ts', 'outside.ts', './out.js', 1, {
      column: 1,
      line: 5,
    });

    const items: readonly TModelItemSpec[] = [
      { id: 0, nodeKind: 'root-node', path: 'src/a.ts', treeOrigin: 'src' },
      { id: 1, nodeKind: 'root-node', path: 'src/b.ts', treeOrigin: 'src' },
      { id: 2, nodeKind: null, path: 'outside.ts', treeOrigin: null },
    ];
    const vertices: readonly TVertexSpec[] = [
      { nature: { inventoryId: 0, kind: 'tree-node' }, path: 'src/a.ts' },
      { nature: { inventoryId: 1, kind: 'tree-node' }, path: 'src/b.ts' },
      { nature: { kind: 'external-local-file' }, path: 'outside.ts' },
    ];

    const modelForward = buildVerificationModel({
      edges: [edgeA, edgeB, edgeC],
      items,
      trees: [createTree('src', [])],
      vertices,
    });
    const modelReversed = buildVerificationModel({
      edges: [edgeC, edgeB, edgeA],
      items,
      trees: [createTree('src', [])],
      vertices,
    });

    const outcomesForward = verifyExternalDependencies(modelForward);
    const outcomesReversed = verifyExternalDependencies(modelReversed);

    expect(outcomesForward).toEqual(outcomesReversed);
    expect(outcomesForward).toHaveLength(3);
    expect(outcomesForward).toEqual([
      expect.objectContaining({ from: 'src/a.ts', importIndex: 0 }),
      expect.objectContaining({ from: 'src/b.ts', importIndex: 0 }),
      expect.objectContaining({ from: 'src/b.ts', importIndex: 1 }),
    ]);
  });

  it('does not mutate the verification model', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'outside.ts')],
      items: commonItems,
      trees: [createTree('src', [])],
      vertices: commonVertices,
    });

    const edgesBefore = [...model.graph.edgeMetadata];
    const treesBefore = [...model.basis.declarations.trees];
    const classificationsBefore = [...model.taxonomy.classifications];

    verifyExternalDependencies(model);

    expect(model.graph.edgeMetadata).toEqual(edgesBefore);
    expect(model.basis.declarations.trees).toEqual(treesBefore);
    expect(model.taxonomy.classifications).toEqual(classificationsBefore);
  });

  it('returns empty array when all edges are between tree nodes', () => {
    const model = buildVerificationModel({
      edges: [createEdge('src/high.ts', 'src/low.ts')],
      items: commonItems,
      trees: [createTree('src', [])],
      vertices: commonVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toEqual([]);
  });

  it('returns empty array when external file imports another external file', () => {
    const externalItems: readonly TModelItemSpec[] = [
      { id: 0, nodeKind: null, path: 'outside1.ts', treeOrigin: null },
      { id: 1, nodeKind: null, path: 'outside2.ts', treeOrigin: null },
    ];
    const externalVertices: readonly TVertexSpec[] = [
      { nature: { kind: 'external-local-file' }, path: 'outside1.ts' },
      { nature: { kind: 'external-local-file' }, path: 'outside2.ts' },
    ];

    const model = buildVerificationModel({
      edges: [createEdge('outside1.ts', 'outside2.ts')],
      items: externalItems,
      trees: [createTree('src', [])],
      vertices: externalVertices,
    });

    const outcomes = verifyExternalDependencies(model);

    expect(outcomes).toEqual([]);
  });
});
