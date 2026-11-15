import { compareOrdinal } from '../../../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

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

  for (const nodeIndex of component) {
    if (selfLoopSet.has(nodeIndex)) {
      const pathString = indexToPath[nodeIndex];
      return pathString === undefined
        ? null
        : {
            element: pathString,
            secondNode: pathString,
            witness: [pathString, pathString],
          };
    }
  }

  if (component.length <= 1) {
    return null;
  }

  const componentSet = new Set(component);
  const state: TBfsState = {
    bestCycle: null,
    bestLength: component.length,
  };

  const isLexicographicallySmaller = (
    candidate: readonly string[]
  ): boolean => {
    const incumbent = state.bestCycle;
    if (incumbent === null) {
      return true;
    }
    const leftCopy = [...candidate];
    const rightCopy = [...incumbent];
    let leftPath = leftCopy.shift();
    let rightPath = rightCopy.shift();
    while (leftPath !== undefined && rightPath !== undefined) {
      const comparison = compareOrdinal(leftPath, rightPath);
      if (comparison !== 0) {
        return comparison < 0;
      }
      leftPath = leftCopy.shift();
      rightPath = rightCopy.shift();
    }
    return candidate.length < incumbent.length;
  };

  const reconstructCyclePath = (
    start: number,
    lastNode: number,
    parent: Int32Array
  ): readonly string[] => {
    const reversedNodes: string[] = [];
    let trace = lastNode;
    while (trace !== start && trace !== -1) {
      const nodePath = indexToPath[trace];
      if (nodePath !== undefined) {
        reversedNodes.push(nodePath);
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
  };

  const evaluateCycleCandidate = (
    start: number,
    currentNode: number,
    currentDepth: number,
    parent: Int32Array
  ): void => {
    const cycleLength = currentDepth + 1;
    const candidate = reconstructCyclePath(start, currentNode, parent);
    if (cycleLength < state.bestLength) {
      state.bestLength = cycleLength;
      state.bestCycle = candidate;
      return;
    }
    if (isLexicographicallySmaller(candidate)) {
      state.bestCycle = candidate;
    }
  };

  const exploreBfsNeighbors = (
    currentNode: number,
    start: number,
    currentDepth: number,
    depth: Int32Array,
    parent: Int32Array,
    queue: number[]
  ): void => {
    const neighbors = adjacency[currentNode] ?? [];

    for (const nextNode of neighbors) {
      if (!componentSet.has(nextNode) || nextNode < start) {
        continue;
      }
      if (nextNode === start) {
        evaluateCycleCandidate(start, currentNode, currentDepth, parent);
      } else {
        const recordedDepth = depth[nextNode];
        if (recordedDepth === -1) {
          depth[nextNode] = currentDepth + 1;
          parent[nextNode] = currentNode;
          queue.push(nextNode);
        }
      }
    }
  };

  const runBfsFromStart = (start: number): void => {
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
        queue
      );
    }
  };

  for (const start of component) {
    runBfsFromStart(start);
  }

  return state.bestCycle === null
    ? null
    : {
        element: state.bestCycle[0] ?? '',
        secondNode: state.bestCycle[1] ?? '',
        witness: state.bestCycle,
      };
}
