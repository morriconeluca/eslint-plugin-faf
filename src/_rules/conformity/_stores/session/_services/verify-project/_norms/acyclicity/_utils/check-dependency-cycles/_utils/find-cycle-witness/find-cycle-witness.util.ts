import { buildWitnessPayload } from './_utils/build-witness-payload/index.js';
import { comparePaths } from './_utils/compare-paths/index.js';
import { findSelfLoopWitness } from './_utils/find-self-loop-witness/index.js';

export function findCycleWitness(
  component: readonly number[],
  selfLoopSet: ReadonlySet<number>,
  adjacency: readonly (readonly number[])[],
  indexToPath: readonly string[],
  nodeCount: number
): null | {
  readonly element: string;
  readonly secondNode: string;
  readonly witness: readonly string[];
} {
  type TBfsState = {
    bestCycle: null | readonly string[];
    bestLength: number;
  };

  function reconstructCyclePath(
    start: number,
    lastNode: number,
    parent: Int32Array
  ): readonly string[] {
    const reversedNodes: string[] = [];
    let trace = lastNode;
    while (trace !== start && trace !== -1) {
      const p = indexToPath[trace];
      if (p !== undefined) {
        reversedNodes.push(p);
      }
      const nextTrace = parent[trace];
      trace = nextTrace ?? -1;
    }
    const startPath = indexToPath[start];
    if (startPath !== undefined) {
      reversedNodes.push(startPath);
    }
    reversedNodes.reverse();
    if (startPath !== undefined) {
      reversedNodes.push(startPath);
    }
    return reversedNodes;
  }

  function evaluateCycleCandidate(
    start: number,
    currentNode: number,
    currentDepth: number,
    parent: Int32Array,
    state: TBfsState
  ): void {
    const cycleLength = currentDepth + 1;
    const candidate = reconstructCyclePath(start, currentNode, parent);
    if (cycleLength < state.bestLength) {
      state.bestLength = cycleLength;
      state.bestCycle = candidate;
      return;
    }
    if (
      state.bestCycle === null ||
      comparePaths(candidate, state.bestCycle) < 0
    ) {
      state.bestCycle = candidate;
    }
  }

  function exploreBfsNeighbors(
    currentNode: number,
    start: number,
    currentDepth: number,
    depth: Int32Array,
    parent: Int32Array,
    queue: number[],
    state: TBfsState
  ): void {
    const neighbors = adjacency[currentNode] ?? [];

    for (const nextNode of neighbors) {
      if (!componentSet.has(nextNode) || nextNode < start) {
        continue;
      }
      if (nextNode === start) {
        evaluateCycleCandidate(start, currentNode, currentDepth, parent, state);
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

  function runBfsFromStart(start: number, state: TBfsState): void {
    const depth = new Int32Array(nodeCount);
    depth.fill(-1);
    const parent = new Int32Array(nodeCount);
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
      exploreBfsNeighbors(
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

  const selfLoopWitness = findSelfLoopWitness(
    component,
    selfLoopSet,
    indexToPath
  );
  if (selfLoopWitness !== null) {
    return buildWitnessPayload(selfLoopWitness);
  }

  if (component.length <= 1) {
    return null;
  }

  const componentSet = new Set(component);
  const state: TBfsState = {
    bestCycle: null,
    bestLength: component.length,
  };

  for (const start of component) {
    runBfsFromStart(start, state);
  }

  return state.bestCycle === null ? null : buildWitnessPayload(state.bestCycle);
}
