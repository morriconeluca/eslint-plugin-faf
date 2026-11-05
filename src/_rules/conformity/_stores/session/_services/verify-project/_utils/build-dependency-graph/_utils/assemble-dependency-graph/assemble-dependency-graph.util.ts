import type {
  TDependencyGraph,
  TEdgeMetadata,
  TLibraryNote,
  TVertexNature,
} from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TPendingEdge } from '../../_build-dependency-graph@shared/_types/pending-edge.type.js';

export function assembleDependencyGraph(
  paths: readonly string[],
  natures: readonly TVertexNature[],
  edges: readonly TPendingEdge[],
  libraryNotes: readonly TLibraryNote[]
): TDependencyGraph {
  const emptyEdges = (): TPendingEdge[] => [];
  const groups = Array.from(paths, (path) => ({
    edges: emptyEdges(),
    path,
  }));
  for (const edge of edges) {
    const group = groups.at(edge.sourceVertex);
    if (group === undefined) {
      continue;
    }
    group.edges.push(edge);
  }

  const destinationVertices: number[] = [];
  const edgeMetadata: TEdgeMetadata[] = [];
  const rowOffsets = new Int32Array(paths.length + 1);
  const edgesBySourcePath = new Map<string, readonly number[]>();
  const pathToVertex = new Map<string, number>();
  let edgeIndex = 0;
  for (const [vertex, group] of groups.entries()) {
    rowOffsets[vertex] = edgeIndex;
    pathToVertex.set(group.path, vertex);
    const indices: number[] = [];
    for (const edge of group.edges) {
      destinationVertices.push(edge.destinationVertex);
      edgeMetadata.push(edge.metadata);
      indices.push(edgeIndex);
      edgeIndex += 1;
    }
    edgesBySourcePath.set(group.path, indices);
  }
  rowOffsets[paths.length] = edgeIndex;

  const libraryNotesBySourcePath = new Map<string, number[]>();
  for (const [index, note] of libraryNotes.entries()) {
    const existing = libraryNotesBySourcePath.get(note.sourcePath);
    if (existing === undefined) {
      libraryNotesBySourcePath.set(note.sourcePath, [index]);
    } else {
      existing.push(index);
    }
  }

  return {
    columnTargets: Int32Array.from(destinationVertices),
    edgeCount: destinationVertices.length,
    edgeMetadata,
    edgesBySourcePath,
    libraryNotes,
    libraryNotesBySourcePath,
    pathToVertex,
    rowOffsets,
    vertexCount: paths.length,
    vertexNatures: natures,
    vertexToPath: paths,
  };
}
