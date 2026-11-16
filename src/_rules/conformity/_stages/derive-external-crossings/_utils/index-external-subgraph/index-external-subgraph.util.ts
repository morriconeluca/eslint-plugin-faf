import type { TDependencyGraph } from '../../../../_conformity@shared/_types/verification-model.type.js';
import type {
  TDestinationEntry,
  TIndexedExternalSubgraph,
  TTreeEdge,
} from '../../_derive-external-crossings@shared/_types/indexed-subgraph.type.js';

export function indexExternalSubgraph(
  graph: TDependencyGraph
): TIndexedExternalSubgraph {
  const externalLocalFile = 'external-local-file';
  const treeNode = 'tree-node';

  const reverseExternalEdges: number[][] = Array.from(
    { length: graph.vertexCount },
    () => []
  );
  const treeEdgesByExternal: TTreeEdge[][] = Array.from(
    { length: graph.vertexCount },
    () => []
  );
  const destinationsMap = new Map<number, number[]>();

  const recordExternalEdge = (source: number, target: number): void => {
    const targetNature = graph.vertexNatures[target]?.kind;
    if (targetNature === externalLocalFile) {
      const reverseList = reverseExternalEdges[target];
      if (reverseList !== undefined && !reverseList.includes(source)) {
        reverseList.push(source);
      }
      return;
    }
    if (targetNature !== treeNode) {
      return;
    }
    const existing = destinationsMap.get(target);
    if (existing === undefined) {
      destinationsMap.set(target, [source]);
      return;
    }
    if (!existing.includes(source)) {
      existing.push(source);
    }
  };

  const recordTreeEdge = (
    source: number,
    target: number,
    edgeIndex: number
  ): void => {
    const targetNature = graph.vertexNatures[target]?.kind;
    if (targetNature !== externalLocalFile) {
      return;
    }
    const metadata = graph.edgeMetadata[edgeIndex];
    if (metadata !== undefined) {
      treeEdgesByExternal[target]?.push({ metadata, sourceVertex: source });
    }
  };

  const processEdge = (
    source: number,
    sourceNature: string | undefined,
    edgeIndex: number
  ): void => {
    const target = graph.columnTargets[edgeIndex];
    if (target === undefined) {
      return;
    }
    if (sourceNature === externalLocalFile) {
      recordExternalEdge(source, target);
      return;
    }
    if (sourceNature === treeNode) {
      recordTreeEdge(source, target, edgeIndex);
    }
  };

  for (
    let sourceVertex = 0;
    sourceVertex < graph.vertexCount;
    sourceVertex += 1
  ) {
    const sourceNature = graph.vertexNatures[sourceVertex]?.kind;
    const offsetStart = graph.rowOffsets[sourceVertex] ?? 0;
    const offsetEnd = graph.rowOffsets[sourceVertex + 1] ?? 0;

    for (let edgeIndex = offsetStart; edgeIndex < offsetEnd; edgeIndex += 1) {
      processEdge(sourceVertex, sourceNature, edgeIndex);
    }
  }

  const destinations: TDestinationEntry[] = [];
  for (const [destinationVertex, externalSources] of destinationsMap) {
    destinations.push({ destinationVertex, externalSources });
  }
  destinations.sort(
    (left, right) => left.destinationVertex - right.destinationVertex
  );

  return {
    destinations,
    reverseExternalEdges,
    treeEdgesByExternal,
  };
}
