import { processStackTop } from './_utils/process-stack-top/index.js';

export function computeFinishStack(
  nodeCount: number,
  adjacency: readonly (readonly number[])[]
): readonly number[] {
  const visited = new Uint8Array(nodeCount);
  const edgeIndices = new Int32Array(nodeCount);
  const finishStack: number[] = [];

  for (let root = 0; root < nodeCount; root += 1) {
    if (visited[root] === 1) {
      continue;
    }
    visited[root] = 1;
    const callStack = [root];

    while (callStack.length > 0) {
      processStackTop(callStack, edgeIndices, adjacency, visited, finishStack);
    }
  }

  return finishStack;
}
