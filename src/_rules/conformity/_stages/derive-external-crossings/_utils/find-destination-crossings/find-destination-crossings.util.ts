import type {
  TDependencyGraph,
  TExternalCrossing,
} from '../../../../_conformity@shared/_types/verification-model.type.js';
import type {
  TCandidateCrossing,
  TDestinationEntry,
  TIndexedExternalSubgraph,
} from '../../_derive-external-crossings@shared/_types/indexed-subgraph.type.js';

import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';
import { compareSourceLocations } from '../../../../_conformity@shared/_utils/compare-source-locations/index.js';

export function findDestinationCrossings(
  destination: TDestinationEntry,
  indexed: TIndexedExternalSubgraph,
  graph: TDependencyGraph
): readonly TExternalCrossing[] {
  const readPath = (vertex: number): string => graph.vertexToPath[vertex] ?? '';

  const runBackwardBfs = (): {
    readonly distanceToDestination: Int32Array;
    readonly nextInPath: Int32Array;
    readonly reachedExternal: readonly number[];
  } => {
    const distanceToDestination = new Int32Array(graph.vertexCount).fill(-1);
    const nextInPath = new Int32Array(graph.vertexCount);

    distanceToDestination[destination.destinationVertex] = 0;
    for (const externalSource of destination.externalSources) {
      distanceToDestination[externalSource] = 1;
      nextInPath[externalSource] = destination.destinationVertex;
    }

    let currentDistance = 2;

    const expandNextLevel = (level: readonly number[]): readonly number[] => {
      const candidateMap = new Map<number, number>();

      for (const successorVertex of level) {
        const reverseList = indexed.reverseExternalEdges[successorVertex];
        if (reverseList === undefined) {
          continue;
        }
        for (const predecessorVertex of reverseList) {
          if (distanceToDestination[predecessorVertex] !== -1) {
            continue;
          }
          const existing = candidateMap.get(predecessorVertex);
          if (
            existing === undefined ||
            compareOrdinal(readPath(successorVertex), readPath(existing)) < 0
          ) {
            candidateMap.set(predecessorVertex, successorVertex);
          }
        }
      }

      const nextLevel: number[] = [];
      for (const [predecessorVertex, bestNext] of candidateMap) {
        distanceToDestination[predecessorVertex] = currentDistance;
        nextInPath[predecessorVertex] = bestNext;
        nextLevel.push(predecessorVertex);
      }
      return nextLevel;
    };

    const reachedExternal: number[] = [...destination.externalSources];
    let currentLevel: readonly number[] = destination.externalSources;

    while (currentLevel.length > 0) {
      currentLevel = expandNextLevel(currentLevel);
      reachedExternal.push(...currentLevel);
      currentDistance += 1;
    }

    return { distanceToDestination, nextInPath, reachedExternal };
  };

  const compareCandidates = (
    candidate: TCandidateCrossing,
    current: TCandidateCrossing
  ): number => {
    if (candidate.distance !== current.distance) {
      return candidate.distance - current.distance;
    }
    if (candidate.externalStart !== current.externalStart) {
      return compareOrdinal(
        readPath(candidate.externalStart),
        readPath(current.externalStart)
      );
    }
    const positionComparison = compareSourceLocations(
      candidate.metadata.position,
      current.metadata.position
    );
    return positionComparison === 0
      ? candidate.metadata.importIndex - current.metadata.importIndex
      : positionComparison;
  };

  const collectBestCandidates = (
    distanceToDestination: Int32Array,
    reachedExternal: readonly number[]
  ): ReadonlyMap<number, TCandidateCrossing> => {
    const bestBySource = new Map<number, TCandidateCrossing>();

    for (const externalVertex of reachedExternal) {
      const treeEdges = indexed.treeEdgesByExternal[externalVertex];
      const distance = distanceToDestination[externalVertex];
      if (treeEdges === undefined || distance === undefined) {
        continue;
      }
      for (const edge of treeEdges) {
        const candidate: TCandidateCrossing = {
          distance,
          externalStart: externalVertex,
          metadata: edge.metadata,
        };
        const existing = bestBySource.get(edge.sourceVertex);
        if (
          existing === undefined ||
          compareCandidates(candidate, existing) < 0
        ) {
          bestBySource.set(edge.sourceVertex, candidate);
        }
      }
    }

    return bestBySource;
  };

  const reconstructCrossings = (
    bestBySource: ReadonlyMap<number, TCandidateCrossing>,
    nextInPath: Int32Array
  ): readonly TExternalCrossing[] => {
    const destinationPath = readPath(destination.destinationVertex);

    const reconstructChain = (
      sourceVertex: number,
      start: number
    ): readonly string[] => {
      const chain: string[] = [readPath(sourceVertex)];
      let current = start;
      while (current !== destination.destinationVertex) {
        chain.push(readPath(current));
        const next = nextInPath[current];
        if (next === undefined) {
          break;
        }
        current = next;
      }
      chain.push(destinationPath);
      return chain;
    };

    const crossings: TExternalCrossing[] = [];
    for (const [sourceVertex, winning] of bestBySource) {
      const sourcePath = readPath(sourceVertex);
      const chain = reconstructChain(sourceVertex, winning.externalStart);
      crossings.push({
        chain,
        destinationPath,
        importIndex: winning.metadata.importIndex,
        position: winning.metadata.position,
        sourcePath,
        specifier: winning.metadata.specifier,
      });
    }
    return crossings;
  };

  const bfs = runBackwardBfs();
  const bestBySource = collectBestCandidates(
    bfs.distanceToDestination,
    bfs.reachedExternal
  );
  return reconstructCrossings(bestBySource, bfs.nextInPath);
}
