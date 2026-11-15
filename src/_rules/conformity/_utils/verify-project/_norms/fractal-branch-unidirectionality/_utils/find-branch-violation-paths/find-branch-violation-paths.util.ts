import type { TEdgeMetadata } from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TBranchViolationPath,
  TCandidateBranchSource,
  TFindBranchViolationPathsInput,
  TQueueItem,
} from './find-branch-violation-paths.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function findBranchViolationPaths(
  input: TFindBranchViolationPathsInput
): readonly TBranchViolationPath[] {
  type TExplorationState = {
    readonly queue: TQueueItem[];
    readonly source: TCandidateBranchSource;
    readonly violations: Map<number, TBranchViolationPath>;
    readonly visited: Set<number>;
  };

  const { candidateSources, graph, isViolation } = input;
  const memo = new Map<number, readonly TBranchViolationPath[]>();

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

  const recordViolation = (
    next: number,
    sourcePath: string,
    chain: readonly string[],
    firstEdge: TEdgeMetadata,
    violations: Map<number, TBranchViolationPath>
  ): void => {
    const existing = violations.get(next);
    const isBetter =
      existing === undefined ||
      chain.length < existing.chain.length ||
      (chain.length === existing.chain.length &&
        chain.join('\0') < existing.chain.join('\0'));
    if (isBetter) {
      violations.set(next, {
        chain,
        firstEdge,
        sourcePath,
        targetVertex: next,
      });
    }
  };

  const incorporateMemoized = (
    pathToNext: readonly string[],
    initialEdge: TEdgeMetadata,
    memoized: readonly TBranchViolationPath[],
    state: TExplorationState
  ): void => {
    const seen = new Set(pathToNext);
    for (const entry of memoized) {
      const destinationPath = graph.vertexToPath[entry.targetVertex] ?? '';
      const hasCycle = entry.chain
        .slice(1)
        .some((element) => seen.has(element));
      if (hasCycle || !isViolation(state.source.path, destinationPath)) {
        continue;
      }
      recordViolation(
        entry.targetVertex,
        state.source.path,
        [...pathToNext, ...entry.chain.slice(1)],
        initialEdge,
        state.violations
      );
    }
  };

  const expandEdge = (
    edgeIndex: number,
    chainToCurrent: readonly string[],
    parentFirstEdge: TEdgeMetadata | undefined,
    state: TExplorationState
  ): void => {
    const next = graph.columnTargets[edgeIndex];
    const edge = graph.edgeMetadata[edgeIndex];
    if (next === undefined || edge === undefined) {
      return;
    }
    const initialEdge = parentFirstEdge ?? edge;
    const chainToNext =
      parentFirstEdge === undefined
        ? [state.source.path, edge.destinationPath]
        : [...chainToCurrent, edge.destinationPath];

    if (isViolation(state.source.path, edge.destinationPath)) {
      recordViolation(
        next,
        state.source.path,
        chainToNext,
        initialEdge,
        state.violations
      );
      return;
    }
    const memoized = memo.get(next);
    if (memoized !== undefined) {
      incorporateMemoized(chainToNext, initialEdge, memoized, state);
      return;
    }
    if (state.visited.has(next)) {
      return;
    }
    state.visited.add(next);
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
      violations: new Map<number, TBranchViolationPath>(),
      visited: new Set<number>([source.vertex]),
    };
    const sourceOutgoing = sortedEdges[source.vertex] ?? [];
    for (const edgeIndex of sourceOutgoing) {
      expandEdge(edgeIndex, [], undefined, state);
    }
    let item = state.queue.shift();
    while (item !== undefined) {
      const outgoing = sortedEdges[item.current] ?? [];
      for (const edgeIndex of outgoing) {
        expandEdge(edgeIndex, item.chain, item.firstEdge, state);
      }
      item = state.queue.shift();
    }
    const recorded = [...state.violations].map(([, value]) => value);
    memo.set(source.vertex, recorded);
    return recorded;
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
