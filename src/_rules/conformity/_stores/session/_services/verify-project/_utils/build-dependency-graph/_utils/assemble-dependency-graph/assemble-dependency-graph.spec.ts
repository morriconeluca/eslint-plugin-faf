import { describe, expect, it } from 'vitest';

import type {
  TLibraryNote,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TPendingEdge } from '../../_build-dependency-graph@shared/_types/pending-edge.type.js';

import { assembleDependencyGraph } from './index.js';

const SOURCE = 'src/a.ts';
const OTHER = 'src/b.ts';

const nature = (inventoryId: number): TVertexNature => ({
  inventoryId,
  kind: 'tree-node',
});

const edge = (sourceVertex: number, importIndex: number): TPendingEdge => ({
  destinationVertex: 0,
  metadata: {
    aliasAlternatives: [],
    aliasUsed: null,
    destinationPath: OTHER,
    importIndex,
    isTypeOnly: false,
    position: { column: 1, line: importIndex + 1 },
    sourcePath: SOURCE,
    specifier: './b.js',
    syntaxKind: 'named-import',
  },
  sourceVertex,
});

const note = (sourcePath: string, importIndex: number): TLibraryNote => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex,
  isTypeOnly: false,
  packageName: 'react',
  position: { column: 1, line: importIndex + 1 },
  sourcePath,
  specifier: 'react',
  syntaxKind: 'named-import',
});

describe('assembleDependencyGraph', () => {
  it('builds CSR offsets, column targets, and a total source index', () => {
    const graph = assembleDependencyGraph(
      [SOURCE, OTHER],
      [nature(2), nature(9)],
      [edge(1, 0), edge(1, 1)],
      []
    );

    expect(graph.vertexCount).toBe(2);
    expect(graph.vertexToPath).toEqual([SOURCE, OTHER]);
    expect(graph.vertexNatures).toEqual([nature(2), nature(9)]);
    expect(graph.pathToVertex.get(OTHER)).toBe(1);
    expect(graph.edgeCount).toBe(2);
    expect([...graph.columnTargets]).toEqual([0, 0]);
    expect([...graph.rowOffsets]).toEqual([0, 0, 2]);
    expect(graph.edgesBySourcePath.get(SOURCE)).toEqual([]);
    expect(graph.edgesBySourcePath.get(OTHER)).toEqual([0, 1]);
    expect(graph.edgeMetadata.map((item) => item.importIndex)).toEqual([0, 1]);
  });

  it('indexes multiple library notes of the same source and ignores edges outside the vertex list', () => {
    const graph = assembleDependencyGraph(
      [SOURCE],
      [{ kind: 'external-local-file' }],
      [edge(4, 0)],
      [note(SOURCE, 0), note(SOURCE, 1), note(OTHER, 0)]
    );

    expect(graph.edgeCount).toBe(0);
    expect([...graph.columnTargets]).toEqual([]);
    expect([...graph.rowOffsets]).toEqual([0, 0]);
    expect(graph.libraryNotesBySourcePath.get(SOURCE)).toEqual([0, 1]);
    expect(graph.libraryNotesBySourcePath.get(OTHER)).toEqual([2]);
  });

  it('returns an empty CSR graph when there are no vertices', () => {
    const graph = assembleDependencyGraph([], [], [], []);

    expect(graph.vertexCount).toBe(0);
    expect(graph.edgeCount).toBe(0);
    expect([...graph.rowOffsets]).toEqual([0]);
    expect(graph.edgesBySourcePath.size).toBe(0);
    expect(graph.libraryNotesBySourcePath.size).toBe(0);
  });
});
