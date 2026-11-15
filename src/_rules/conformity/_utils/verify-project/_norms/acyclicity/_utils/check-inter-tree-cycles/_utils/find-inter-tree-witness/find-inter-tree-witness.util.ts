import type { TSourceLocation } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';

import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function findInterTreeWitness(
  component: readonly number[],
  adjacency: readonly (readonly number[])[],
  transitions: readonly (readonly (null | {
    readonly position?: TSourceLocation;
    readonly segment: readonly string[];
  })[])[],
  treeCount: number
): null | {
  readonly element: string;
  readonly position?: TSourceLocation;
  readonly witness: readonly (readonly string[])[];
} {
  if (component.length < 2) {
    return null;
  }

  type TTreeBfsState = {
    bestLength: number;
    bestPosition?: TSourceLocation;
    bestWitness: null | readonly (readonly string[])[];
  };

  type TQueueEntry = {
    readonly depth: number;
    readonly node: number;
  };

  const componentSet = new Set(component);
  const state: TTreeBfsState = {
    bestLength: component.length,
    bestWitness: null,
  };

  const isWitnessSmaller = (
    candidate: readonly (readonly string[])[]
  ): boolean => {
    const incumbent = state.bestWitness;
    if (incumbent === null) {
      return true;
    }
    for (const [index, leftSegment] of candidate.entries()) {
      const rightSegment = incumbent[index];
      if (rightSegment === undefined) {
        return false;
      }
      const sourceComparison = compareOrdinal(
        leftSegment[0] ?? '',
        rightSegment[0] ?? ''
      );
      const segmentComparison =
        sourceComparison === 0
          ? compareOrdinal(leftSegment.at(-1) ?? '', rightSegment.at(-1) ?? '')
          : sourceComparison;
      if (segmentComparison !== 0) {
        return segmentComparison < 0;
      }
    }
    return candidate.length < incumbent.length;
  };

  const buildCycleWitness = (
    start: number,
    lastNode: number,
    parent: Int32Array
  ): null | {
    readonly position?: TSourceLocation;
    readonly witness: readonly (readonly string[])[];
  } => {
    const reversedTrees: number[] = [];
    let trace = lastNode;
    while (trace !== start) {
      reversedTrees.push(trace);
      trace = parent[trace] ?? start;
    }
    reversedTrees.reverse();
    const treePath: readonly [number, ...number[]] = [
      start,
      ...reversedTrees,
      start,
    ];

    const [initialTreeIndex, ...remainingTreeIndices] = treePath;
    const witness: (readonly string[])[] = [];
    let firstPosition: TSourceLocation | undefined;
    let previousTreeIndex = initialTreeIndex;

    for (const [stepIndex, nextTreeIndex] of remainingTreeIndices.entries()) {
      const transition = transitions[previousTreeIndex]?.[nextTreeIndex];
      if (transition === null || transition === undefined) {
        return null;
      }
      if (stepIndex === 0) {
        firstPosition = transition.position;
      }
      witness.push(transition.segment);
      previousTreeIndex = nextTreeIndex;
    }

    return { position: firstPosition, witness };
  };

  const evaluateTreeCycle = (
    start: number,
    currentNode: number,
    currentDepth: number,
    parent: Int32Array
  ): void => {
    const cycleLength = currentDepth + 1;
    const built = buildCycleWitness(start, currentNode, parent);
    if (built === null) {
      return;
    }
    if (cycleLength < state.bestLength) {
      state.bestLength = cycleLength;
      state.bestWitness = built.witness;
      state.bestPosition = built.position;
      return;
    }
    if (!isWitnessSmaller(built.witness)) {
      return;
    }

    state.bestWitness = built.witness;
    state.bestPosition = built.position;
  };

  const exploreTreeNeighbors = (
    currentNode: number,
    start: number,
    currentDepth: number,
    visited: Uint8Array,
    parent: Int32Array,
    queue: TQueueEntry[]
  ): void => {
    const neighbors = adjacency[currentNode] ?? [];

    for (const nextNode of neighbors) {
      if (!componentSet.has(nextNode) || nextNode < start) {
        continue;
      }
      if (nextNode === start) {
        evaluateTreeCycle(start, currentNode, currentDepth, parent);
      } else {
        if (visited[nextNode] === 0) {
          visited[nextNode] = 1;
          parent[nextNode] = currentNode;
          queue.push({ depth: currentDepth + 1, node: nextNode });
        }
      }
    }
  };

  const runTreeBfsFromStart = (start: number): void => {
    const visited = new Uint8Array(treeCount);
    const parent = new Int32Array(treeCount);
    parent.fill(-1);

    const queue: TQueueEntry[] = [{ depth: 0, node: start }];
    visited[start] = 1;

    let entry = queue.shift();
    while (entry !== undefined) {
      if (entry.depth >= state.bestLength) {
        break;
      }
      exploreTreeNeighbors(
        entry.node,
        start,
        entry.depth,
        visited,
        parent,
        queue
      );
      entry = queue.shift();
    }
  };

  for (const start of component) {
    runTreeBfsFromStart(start);
  }

  if (state.bestWitness === null) {
    return null;
  }

  const firstSegment = state.bestWitness[0];
  const element = firstSegment?.[0] ?? '';

  return {
    element,
    position: state.bestPosition,
    witness: state.bestWitness,
  };
}
