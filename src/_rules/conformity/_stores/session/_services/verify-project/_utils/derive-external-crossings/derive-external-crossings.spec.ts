import { describe, expect, it } from 'vitest';

import type {
  TDependencyGraph,
  TEdgeMetadata,
  TLibraryNote,
  TVertexNature,
} from '../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { deriveExternalCrossings } from './derive-external-crossings.util.js';

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
  }[],
  libraryNotes: readonly TLibraryNote[] = []
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
    libraryNotes,
    libraryNotesBySourcePath: new Map(),
    pathToVertex,
    rowOffsets,
    vertexCount: paths.length,
    vertexNatures: natures,
    vertexToPath: paths,
  };
};

describe('deriveExternalCrossings', () => {
  it('discovers crossings through one and two external local files', () => {
    const graph = createTestGraph(
      [
        'src/a.ts',
        'external/x.ts',
        'src/b.ts',
        'src/c.ts',
        'external/y1.ts',
        'external/y2.ts',
        'src/d.ts',
      ],
      [
        TREE_NODE,
        EXTERNAL_FILE,
        TREE_NODE,
        TREE_NODE,
        EXTERNAL_FILE,
        EXTERNAL_FILE,
        TREE_NODE,
      ],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 4, source: 3 },
        { destination: 5, source: 4 },
        { destination: 6, source: 5 },
      ]
    );

    const crossings = deriveExternalCrossings(graph);

    expect(crossings).toEqual([
      {
        chain: ['src/a.ts', 'external/x.ts', 'src/b.ts'],
        destinationPath: 'src/b.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/a.ts',
        specifier: './external/x.ts.js',
      },
      {
        chain: ['src/c.ts', 'external/y1.ts', 'external/y2.ts', 'src/d.ts'],
        destinationPath: 'src/d.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/c.ts',
        specifier: './external/y1.ts.js',
      },
    ]);
  });

  it('records a crossing that returns to the same tree and to the exact same source node', () => {
    const graph = createTestGraph(
      ['src/widget.ts', 'external/helper.ts'],
      [TREE_NODE, EXTERNAL_FILE],
      [
        { destination: 1, source: 0 },
        { destination: 0, source: 1 },
      ]
    );

    const crossings = deriveExternalCrossings(graph);

    expect(crossings).toEqual([
      {
        chain: ['src/widget.ts', 'external/helper.ts', 'src/widget.ts'],
        destinationPath: 'src/widget.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/widget.ts',
        specifier: './external/helper.ts.js',
      },
    ]);
  });

  it('records a crossing toward a node in another tree', () => {
    const graph = createTestGraph(
      ['tree1/source.ts', 'external/bridge.ts', 'tree2/target.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
      ]
    );

    const crossings = deriveExternalCrossings(graph);

    expect(crossings).toEqual([
      {
        chain: ['tree1/source.ts', 'external/bridge.ts', 'tree2/target.ts'],
        destinationPath: 'tree2/target.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'tree1/source.ts',
        specifier: './external/bridge.ts.js',
      },
    ]);
  });

  it('produces two distinct crossings and never skips an intermediate tree node in A -> X -> B -> Y -> A', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts', 'external/y.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE, EXTERNAL_FILE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 3, source: 2 },
        { destination: 0, source: 3 },
      ]
    );

    const crossings = deriveExternalCrossings(graph);

    expect(crossings).toEqual([
      {
        chain: ['src/a.ts', 'external/x.ts', 'src/b.ts'],
        destinationPath: 'src/b.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/a.ts',
        specifier: './external/x.ts.js',
      },
      {
        chain: ['src/b.ts', 'external/y.ts', 'src/a.ts'],
        destinationPath: 'src/a.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/b.ts',
        specifier: './external/y.ts.js',
      },
    ]);
  });

  it('ignores external cycles without exit and continues exploring cycles with exits', () => {
    const noExitGraph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'external/y.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
        { destination: 1, source: 2 },
      ]
    );

    expect(deriveExternalCrossings(noExitGraph)).toEqual([]);

    const withExitGraph = createTestGraph(
      ['src/c.ts', 'external/x.ts', 'external/y.ts', 'src/b.ts', 'src/a.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE, TREE_NODE],
      [
        { destination: 1, source: 4 },
        { destination: 2, source: 1 },
        { destination: 1, source: 2 },
        { destination: 3, source: 1 },
        { destination: 0, source: 2 },
      ]
    );

    const crossings = deriveExternalCrossings(withExitGraph);

    expect(crossings).toEqual([
      {
        chain: ['src/a.ts', 'external/x.ts', 'src/b.ts'],
        destinationPath: 'src/b.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/a.ts',
        specifier: './external/x.ts.js',
      },
      {
        chain: ['src/a.ts', 'external/x.ts', 'external/y.ts', 'src/c.ts'],
        destinationPath: 'src/c.ts',
        importIndex: 0,
        position: { column: 1, line: 1 },
        sourcePath: 'src/a.ts',
        specifier: './external/x.ts.js',
      },
    ]);
  });

  it('deterministically selects the shortest witness and breaks ties by path order and position', () => {
    const multipleLengthsGraph = createTestGraph(
      [
        'src/a.ts',
        'external/direct.ts',
        'external/step1.ts',
        'external/step2.ts',
        'src/b.ts',
      ],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 2, source: 0 },
        { destination: 3, source: 2 },
        { destination: 4, source: 3 },
        { destination: 1, source: 0 },
        { destination: 4, source: 1 },
      ]
    );

    const lengthWitness = deriveExternalCrossings(multipleLengthsGraph);
    expect(lengthWitness).toHaveLength(1);
    expect(lengthWitness[0]?.chain).toEqual([
      'src/a.ts',
      'external/direct.ts',
      'src/b.ts',
    ]);

    const equalLengthGraph = createTestGraph(
      ['src/a.ts', 'external/beta.ts', 'external/alpha.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 3, source: 1 },
        { destination: 2, source: 0 },
        { destination: 3, source: 2 },
      ]
    );

    const pathWitness = deriveExternalCrossings(equalLengthGraph);
    expect(pathWitness).toHaveLength(1);
    expect(pathWitness[0]?.chain).toEqual([
      'src/a.ts',
      'external/alpha.ts',
      'src/b.ts',
    ]);

    const equalPathGraph = createTestGraph(
      ['src/a.ts', 'external/bridge.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, importIndex: 1, line: 15, source: 0 },
        { destination: 1, importIndex: 0, line: 3, source: 0 },
        { destination: 2, source: 1 },
      ]
    );

    const positionWitness = deriveExternalCrossings(equalPathGraph);
    expect(positionWitness).toHaveLength(1);
    expect(positionWitness[0]?.position).toEqual({ column: 1, line: 3 });
    expect(positionWitness[0]?.importIndex).toBe(0);
  });

  it('ignores external libraries and direct tree-to-tree edges', () => {
    const note: TLibraryNote = {
      aliasAlternatives: [],
      aliasUsed: null,
      importIndex: 0,
      isTypeOnly: false,
      packageName: 'lodash',
      position: { column: 1, line: 1 },
      sourcePath: 'src/a.ts',
      specifier: 'lodash',
      syntaxKind: 'named-import',
    };

    const graph = createTestGraph(
      ['src/a.ts', 'src/b.ts'],
      [TREE_NODE, TREE_NODE],
      [{ destination: 1, source: 0 }],
      [note]
    );

    expect(deriveExternalCrossings(graph)).toEqual([]);
  });

  it('traverses deep chains iteratively without recursion or stack overflow', () => {
    const chainDepth = 50;
    const paths = ['src/start.ts'];
    const natures: TVertexNature[] = [TREE_NODE];
    for (let index = 0; index < chainDepth; index += 1) {
      paths.push(`external/node-${index}.ts`);
      natures.push(EXTERNAL_FILE);
    }
    paths.push('src/end.ts');
    natures.push(TREE_NODE);

    const rawEdges: { destination: number; source: number }[] = [];
    for (let index = 0; index <= chainDepth; index += 1) {
      rawEdges.push({ destination: index + 1, source: index });
    }

    const graph = createTestGraph(paths, natures, rawEdges);
    const crossings = deriveExternalCrossings(graph);

    expect(crossings).toHaveLength(1);
    expect(crossings[0]?.chain).toHaveLength(chainDepth + 2);
    expect(crossings[0]?.sourcePath).toBe('src/start.ts');
    expect(crossings[0]?.destinationPath).toBe('src/end.ts');
  });

  it('produces identical deterministic results when input order is permuted', () => {
    const original = createTestGraph(
      [
        'src/source1.ts',
        'src/source2.ts',
        'external/bridge.ts',
        'src/target.ts',
      ],
      [TREE_NODE, TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 2, source: 0 },
        { destination: 2, source: 1 },
        { destination: 3, source: 2 },
      ]
    );

    const permuted = createTestGraph(
      [
        'src/target.ts',
        'external/bridge.ts',
        'src/source2.ts',
        'src/source1.ts',
      ],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE, TREE_NODE],
      [
        { destination: 1, source: 3 },
        { destination: 1, source: 2 },
        { destination: 0, source: 1 },
      ]
    );

    const resultOriginal = deriveExternalCrossings(original);
    const resultPermuted = deriveExternalCrossings(permuted);

    expect(resultOriginal).toEqual(resultPermuted);
  });

  it('never mutates input graph structures', () => {
    const graph = createTestGraph(
      ['src/a.ts', 'external/x.ts', 'src/b.ts'],
      [TREE_NODE, EXTERNAL_FILE, TREE_NODE],
      [
        { destination: 1, source: 0 },
        { destination: 2, source: 1 },
      ]
    );

    const snapshotTargets = [...graph.columnTargets];
    const snapshotOffsets = [...graph.rowOffsets];
    const snapshotVertexToPath = [...graph.vertexToPath];

    deriveExternalCrossings(graph);

    expect([...graph.columnTargets]).toEqual(snapshotTargets);
    expect([...graph.rowOffsets]).toEqual(snapshotOffsets);
    expect([...graph.vertexToPath]).toEqual(snapshotVertexToPath);
  });
});
