import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { indexExternalSubgraph } from './index.js';

const TREE_NODE: TVertexNature = { inventoryId: 1, kind: 'tree-node' };
const EXTERNAL_FILE: TVertexNature = { kind: 'external-local-file' };

const metadataFor = (
  sourcePath: string,
  destinationPath: string,
  specifier: string
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex: 0,
  isTypeOnly: false,
  position: { column: 1, line: 1 },
  sourcePath,
  specifier,
  syntaxKind: 'named-import',
});

const createTestGraph = (
  paths: readonly string[],
  natures: readonly TVertexNature[],
  rawEdges: readonly { readonly destination: number; readonly source: number }[]
): TDependencyGraph => {
  const edgeMetadata: TEdgeMetadata[] = [];
  const columnTargets: number[] = [];
  const rowOffsets = new Int32Array(paths.length + 1);
  const edgesBySourcePath = new Map<string, readonly number[]>();
  const pathToVertex = new Map<string, number>();

  for (const [index, path] of paths.entries()) {
    pathToVertex.set(path, index);
  }

  let currentEdge = 0;
  for (let u = 0; u < paths.length; u += 1) {
    rowOffsets[u] = currentEdge;
    const indices: number[] = [];
    const sourcePath = paths[u] ?? '';
    for (const raw of rawEdges) {
      if (raw.source !== u) {
        continue;
      }
      const destinationPath = paths[raw.destination] ?? '';
      columnTargets.push(raw.destination);
      edgeMetadata.push(
        metadataFor(sourcePath, destinationPath, `./${destinationPath}.js`)
      );
      indices.push(currentEdge);
      currentEdge += 1;
    }
    edgesBySourcePath.set(sourcePath, indices);
  }
  rowOffsets[paths.length] = currentEdge;

  return {
    columnTargets: Int32Array.from(columnTargets),
    edgeCount: columnTargets.length,
    edgeMetadata,
    edgesBySourcePath,
    libraryNotes: [],
    libraryNotesBySourcePath: new Map(),
    pathToVertex,
    rowOffsets,
    vertexCount: paths.length,
    vertexNatures: natures,
    vertexToPath: paths,
  };
};

describe('indexExternalSubgraph', () => {
  it('indexes external-to-external, tree-to-external, and external-to-tree edges', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'external/y.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 3, source: 2 },
        { destination: 3, source: 0 },
      ]
    );

    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([
      { destinationVertex: 3, externalSources: [2] },
    ]);
    expect(indexed.reverseExternalEdges[2]).toEqual([1]);
    expect(indexed.reverseExternalEdges[1]).toEqual([]);
    expect(indexed.treeEdgesByExternal[1]).toHaveLength(1);
    expect(indexed.treeEdgesByExternal[1]?.[0]?.sourceVertex).toBe(0);
    expect(indexed.treeEdgesByExternal[2]).toEqual([]);
  });

  it('sorts multiple destinations ascending by destinationVertex', () => {
    const graph = createTestGraph(
      ['src/high.ts', 'external/x.ts', 'src/low.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 0, source: 1 },
        { destination: 2, source: 1 },
      ]
    );

    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([
      { destinationVertex: 0, externalSources: [1] },
      { destinationVertex: 2, externalSources: [1] },
    ]);
  });

  it('deduplicates multiple edges between the same external vertices and external to tree', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 2, source: 1 },
      ]
    );

    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([
      { destinationVertex: 2, externalSources: [1] },
    ]);
  });

  it('handles edges with undefined targets, unknown natures, missing metadata, and out of bounds targets', () => {
    const graph: TDependencyGraph = {
      columnTargets: new Int32Array([1, 99, 0, 0, 1]),
      edgeCount: 5,
      edgeMetadata: [],
      edgesBySourcePath: new Map(),
      libraryNotes: [],
      libraryNotesBySourcePath: new Map(),
      pathToVertex: new Map([
        ['external/x.ts', 0],
        ['src/tree.ts', 1],
      ]),
      rowOffsets: new Int32Array([0, 3, 6]),
      vertexCount: 2,
      vertexNatures: [EXTERNAL_FILE, TREE_NODE],
      vertexToPath: ['external/x.ts', 'src/tree.ts'],
    };

    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([
      { destinationVertex: 1, externalSources: [0] },
    ]);
  });

  it('handles edges where source nature is undefined or row offsets are empty', () => {
    const graph: TDependencyGraph = {
      columnTargets: new Int32Array([0]),
      edgeCount: 1,
      edgeMetadata: [],
      edgesBySourcePath: new Map(),
      libraryNotes: [],
      libraryNotesBySourcePath: new Map(),
      pathToVertex: new Map([['unknown.ts', 0]]),
      rowOffsets: new Int32Array(0),
      vertexCount: 1,
      vertexNatures: [],
      vertexToPath: ['unknown.ts'],
    };

    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([]);
  });

  it('handles empty graphs with zero vertices', () => {
    const graph = createTestGraph([], [], []);
    const indexed = indexExternalSubgraph(graph);

    expect(indexed.destinations).toEqual([]);
    expect(indexed.reverseExternalEdges).toEqual([]);
    expect(indexed.treeEdgesByExternal).toEqual([]);
  });
});
