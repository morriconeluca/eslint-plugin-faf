import type { TEdgeMetadata } from '../../../../_conformity@shared/_types/verification-model.type.js';
import type {
  TBranchViolationPath,
  TCandidateBranchSource,
  TFindBranchViolationPathsInput,
  TQueueItem,
} from './find-branch-violation-paths.type.js';

import { compareOrdinal } from '../../../../_conformity@shared/_utils/compare-ordinal/index.js';

export function findBranchViolationPaths(
  input: TFindBranchViolationPathsInput
): readonly TBranchViolationPath[] {
  type TExplorationState = {
    readonly queue: TQueueItem[];
    readonly source: TCandidateBranchSource;
    readonly violations: TBranchViolationPath[];
    readonly visited: Set<number>;
  };

  const { candidateSources, graph, isViolation } = input;

  const sortOutgoingEdges = (vertex: number): readonly number[] => {
    const start = graph.rowOffsets[vertex] ?? 0;
    const end = graph.rowOffsets[vertex + 1] ?? 0;
    const indices: number[] = [];
    for (let index = start; index < end; index += 1) {
      indices.push(index);
    }
    indices.sort((first, second) => {
      const leftEdge = graph.edgeMetadata[first];
      const rightEdge = graph.edgeMetadata[second];
      if (leftEdge === undefined || rightEdge === undefined) {
        return 0;
      }
      const toComparison = compareOrdinal(
        leftEdge.destinationPath,
        rightEdge.destinationPath
      );
      return toComparison === 0
        ? leftEdge.importIndex - rightEdge.importIndex
        : toComparison;
    });
    return indices;
  };

  const expandEdge = (
    edgeIndex: number,
    chainToCurrent: readonly string[],
    parentFirstEdge: TEdgeMetadata | undefined,
    state: TExplorationState
  ): void => {
    const next = graph.columnTargets[edgeIndex];
    const edge = graph.edgeMetadata[edgeIndex];
    if (next === undefined || edge === undefined || state.visited.has(next)) {
      return;
    }
    state.visited.add(next);

    const initialEdge = parentFirstEdge ?? edge;
    const chainToNext =
      parentFirstEdge === undefined
        ? [state.source.path, edge.destinationPath]
        : [...chainToCurrent, edge.destinationPath];

    if (isViolation(state.source.path, edge.destinationPath)) {
      state.violations.push({
        chain: chainToNext,
        firstEdge: initialEdge,
        sourcePath: state.source.path,
        targetVertex: next,
      });
      return;
    }

    state.queue.push({
      chain: chainToNext,
      current: next,
      firstEdge: initialEdge,
    });
  };

  const exploreBfs = (
    source: TCandidateBranchSource,
    sortedEdges: readonly (readonly number[])[]
  ): readonly TBranchViolationPath[] => {
    const state: TExplorationState = {
      queue: [],
      source,
      violations: [],
      visited: new Set<number>([source.vertex]),
    };
    const sourceOutgoing = sortedEdges[source.vertex] ?? [];
    for (const edgeIndex of sourceOutgoing) {
      expandEdge(edgeIndex, [], undefined, state);
    }
    let head = 0;
    let item = state.queue[head];
    while (item !== undefined) {
      const outgoing = sortedEdges[item.current] ?? [];
      for (const edgeIndex of outgoing) {
        expandEdge(edgeIndex, item.chain, item.firstEdge, state);
      }
      head += 1;
      item = state.queue[head];
    }
    return state.violations;
  };

  const sortedEdges = Array.from({ length: graph.vertexCount }, (_, vertex) =>
    sortOutgoingEdges(vertex)
  );
  const orderedSources = [...candidateSources];
  orderedSources.sort((first, second) =>
    first.depth === second.depth
      ? compareOrdinal(first.path, second.path)
      : second.depth - first.depth
  );

  const allViolations: TBranchViolationPath[] = [];
  for (const source of orderedSources) {
    allViolations.push(...exploreBfs(source, sortedEdges));
  }
  return allViolations;
}
