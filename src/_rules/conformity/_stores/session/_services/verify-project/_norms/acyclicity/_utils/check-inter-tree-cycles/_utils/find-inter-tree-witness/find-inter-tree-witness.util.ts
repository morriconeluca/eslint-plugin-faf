import type { TSourceLocation } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { buildTreePathWitness } from './_utils/build-tree-path-witness/index.js';
import { compareTreeWitnesses } from './_utils/compare-tree-witnesses/index.js';
import { reconstructTreeCycle } from './_utils/reconstruct-tree-cycle/index.js';

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
  type TTreeBfsState = {
    bestLength: number;
    bestPosition?: TSourceLocation;
    bestWitness: null | readonly (readonly string[])[];
  };

  if (component.length < 2) {
    return null;
  }

  const componentSet = new Set(component);

  function evaluateTreeCycle(
    start: number,
    currentNode: number,
    currentDepth: number,
    parent: Int32Array,
    state: TTreeBfsState
  ): void {
    const cycleLength = currentDepth + 1;
    const treePath = reconstructTreeCycle(start, currentNode, parent);
    const built = buildTreePathWitness(treePath, transitions);
    if (built === null) {
      return;
    }
    if (cycleLength < state.bestLength) {
      state.bestLength = cycleLength;
      state.bestWitness = built.witness;
      state.bestPosition = built.position;
      return;
    }
    if (
      state.bestWitness !== null &&
      compareTreeWitnesses(built.witness, state.bestWitness) >= 0
    ) {
      return;
    }
    state.bestWitness = built.witness;
    state.bestPosition = built.position;
  }

  function exploreTreeNeighbors(
    currentNode: number,
    start: number,
    currentDepth: number,
    depth: Int32Array,
    parent: Int32Array,
    queue: number[],
    state: TTreeBfsState
  ): void {
    const neighbors = adjacency[currentNode] ?? [];

    for (const nextNode of neighbors) {
      if (!componentSet.has(nextNode) || nextNode < start) {
        continue;
      }
      if (nextNode === start) {
        evaluateTreeCycle(start, currentNode, currentDepth, parent, state);
      } else {
        const recordedDepth = depth[nextNode];
        if (recordedDepth === -1) {
          depth[nextNode] = currentDepth + 1;
          parent[nextNode] = currentNode;
          queue.push(nextNode);
        }
      }
    }
  }

  function runTreeBfsFromStart(start: number, state: TTreeBfsState): void {
    const depth = new Int32Array(treeCount);
    depth.fill(-1);
    const parent = new Int32Array(treeCount);
    parent.fill(-1);

    const queue: number[] = [start];
    depth[start] = 0;
    let queueHead = 0;

    while (queueHead < queue.length) {
      const currentNode = queue[queueHead] ?? 0;
      queueHead += 1;
      const currentDepth = depth[currentNode] ?? 0;
      if (currentDepth >= state.bestLength) {
        break;
      }
      exploreTreeNeighbors(
        currentNode,
        start,
        currentDepth,
        depth,
        parent,
        queue,
        state
      );
    }
  }

  const state: TTreeBfsState = {
    bestLength: component.length,
    bestWitness: null,
  };

  for (const start of component) {
    runTreeBfsFromStart(start, state);
  }

  if (state.bestWitness === null) {
    return null;
  }

  const firstSegment = state.bestWitness[0] ?? [];
  const element = firstSegment[0] ?? '';

  return {
    element,
    position: state.bestPosition,
    witness: state.bestWitness,
  };
}
