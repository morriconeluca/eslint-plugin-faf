import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TIndexedExternalSubgraph } from '../../_derive-external-crossings@shared/_types/indexed-subgraph.type.js';

import { findDestinationCrossings } from './find-destination-crossings.util.js';

const TREE_NODE: TVertexNature = { inventoryId: 1, kind: 'tree-node' };
const EXTERNAL_FILE: TVertexNature = { kind: 'external-local-file' };

const metadataFor = (
  sourcePath: string,
  destinationPath: string,
  line: number,
  importIndex: number
): TEdgeMetadata => ({
  aliasAlternatives: [],
  aliasUsed: null,
  destinationPath,
  importIndex,
  isTypeOnly: false,
  position: { column: 1, line },
  sourcePath,
  specifier: `./${destinationPath}.js`,
  syntaxKind: 'named-import',
});

const createTestGraph = (
  paths: readonly string[],
  natures: readonly TVertexNature[],
  rawEdges: readonly {
    readonly destination: number;
    readonly importIndex?: number;
    readonly line?: number;
    readonly source: number;
  }[]
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
        metadataFor(
          sourcePath,
          destinationPath,
          raw.line ?? 1,
          raw.importIndex ?? 0
        )
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

describe('findDestinationCrossings', () => {
  it('finds crossings through one and two external files', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'external/y.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 3, source: 2 },
      ]
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 3, externalSources: [2] }],
      reverseExternalEdges: [[], [], [1], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 3,
        externalSources: [2],
      },
      indexed,
      graph
    );

    expect(crossings).toEqual([
      {
        chain: ['src/a.ts', 'external/x.ts', 'external/y.ts', 'src/b.ts'],
        destinationPath: 'src/b.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/a.ts',
        specifier: './external/x.ts.js',
      },
    ]);
  });

  it('breaks ties between distinct external start nodes at equal distance using path ordinal', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/beta.ts', 'external/alpha.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 3, externalSources: [1, 2] }],
      reverseExternalEdges: [[], [], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/beta.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/alpha.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 3,
        externalSources: [1, 2],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.chain).toEqual([
      'src/a.ts',
      'external/alpha.ts',
      'src/b.ts',
    ]);
  });

  it('prefers distance 1 over distance 3 when distance 3 is indexed first and distance 1 is second', () => {
    const graph = createTestGraph(
      [
        'src/a.ts',
        'external/a-three1.ts',
        'external/a-three2.ts',
        'external/a-three3.ts',
        'external/z-one.ts',
        'src/b.ts',
      ],
      [
        TREE_NODE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        TREE_NODE,
      ],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 5, externalSources: [3, 4] }],
      reverseExternalEdges: [[], [], [1], [2], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/a-three1.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/z-one.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 5,
        externalSources: [3, 4],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.destinationPath).toBe('src/b.ts');
    expect(crossings[0]?.sourcePath).toBe('src/a.ts');
    expect(crossings[0]?.chain).toEqual([
      'src/a.ts',
      'external/z-one.ts',
      'src/b.ts',
    ]);
  });

  it('prefers distance 1 over distance 3 when distance 1 is indexed first and distance 3 is second', () => {
    const graph = createTestGraph(
      [
        'src/a.ts',
        'external/z-one.ts',
        'external/a-three1.ts',
        'external/a-three2.ts',
        'external/a-three3.ts',
        'src/b.ts',
      ],
      [
        TREE_NODE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        TREE_NODE,
      ],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 5, externalSources: [1, 4] }],
      reverseExternalEdges: [[], [], [], [2], [3], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/z-one.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/a-three1.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
        [],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 5,
        externalSources: [1, 4],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.chain).toEqual([
      'src/a.ts',
      'external/z-one.ts',
      'src/b.ts',
    ]);
  });

  it('selects best predecessor among multiple candidates when first predecessor is worse and second is better', () => {
    const graph = createTestGraph(
      [
        'src/a.ts',
        'external/predecessor.ts',
        'external/alpha.ts',
        'external/beta.ts',
        'src/b.ts',
      ],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 4, externalSources: [3, 2] }],
      reverseExternalEdges: [[], [], [1], [1], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/predecessor.ts', 1, 0),
            sourceVertex: 0,
          },
        ],
        [],
        [],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 4,
        externalSources: [3, 2],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.chain).toEqual([
      'src/a.ts',
      'external/predecessor.ts',
      'external/alpha.ts',
      'src/b.ts',
    ]);
  });

  it('breaks ties on equal length paths by ordinal sequence and then source location', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 2, externalSources: [1] }],
      reverseExternalEdges: [[], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 10, 1),
            sourceVertex: 0,
          },
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 2, 0),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 2,
        externalSources: [1],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.position).toEqual({ column: 1, line: 2 });
    expect(crossings[0]?.importIndex).toBe(0);
  });

  it('rejects candidate with higher source location line when lower line was already recorded', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 2, externalSources: [1] }],
      reverseExternalEdges: [[], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 2, 0),
            sourceVertex: 0,
          },
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 10, 1),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 2,
        externalSources: [1],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.position).toEqual({ column: 1, line: 2 });
    expect(crossings[0]?.importIndex).toBe(0);
  });

  it('breaks ties by import index when source positions are identical', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 2, externalSources: [1] }],
      reverseExternalEdges: [[], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 5, 2),
            sourceVertex: 0,
          },
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 5, 0),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 2,
        externalSources: [1],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.importIndex).toBe(0);
  });

  it('rejects candidate with higher import index when lower import index was already recorded', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 2, externalSources: [1] }],
      reverseExternalEdges: [[], [], []],
      treeEdgesByExternal: [
        [],
        [
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 5, 0),
            sourceVertex: 0,
          },
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 5, 2),
            sourceVertex: 0,
          },
          {
            metadata: metadataFor('src/a.ts', 'external/x.ts', 5, 0),
            sourceVertex: 0,
          },
        ],
        [],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 2,
        externalSources: [1],
      },
      indexed,
      graph
    );

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.importIndex).toBe(0);
  });

  it('falls back safely when vertex indices in destination or edges exceed vertex list', () => {
    const graph: TDependencyGraph = {
      columnTargets: new Int32Array(0),
      edgeCount: 0,
      edgeMetadata: [],
      edgesBySourcePath: new Map(),
      libraryNotes: [],
      libraryNotesBySourcePath: new Map(),
      pathToVertex: new Map([['external/x.ts', 0]]),
      rowOffsets: new Int32Array([0, 0]),
      vertexCount: 1,
      vertexNatures: [EXTERNAL_FILE],
      vertexToPath: ['external/x.ts'],
    };

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 99, externalSources: [0, 999] }],
      reverseExternalEdges: [[]],
      treeEdgesByExternal: [
        [
          {
            metadata: metadataFor('unknown.ts', 'external/x.ts', 1, 0),
            sourceVertex: 99,
          },
        ],
      ],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 99,
        externalSources: [0],
      },
      indexed,
      graph
    );

    expect(crossings).toEqual([
      {
        chain: ['', 'external/x.ts', ''],
        destinationPath: '',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: '',
        specifier: './external/x.ts.js',
      },
    ]);
  });

  it('ignores external nodes with undefined tree edges, undefined reverse list, or distance <= 0', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'external/unreached.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      []
    );

    const indexed: TIndexedExternalSubgraph = {
      destinations: [{ destinationVertex: 3, externalSources: [1] }],
      reverseExternalEdges: [],
      treeEdgesByExternal: [],
    };

    const crossings = findDestinationCrossings(
      indexed.destinations[0] ?? {
        destinationVertex: 3,
        externalSources: [1],
      },
      indexed,
      graph
    );

    expect(crossings).toEqual([]);
  });
});
