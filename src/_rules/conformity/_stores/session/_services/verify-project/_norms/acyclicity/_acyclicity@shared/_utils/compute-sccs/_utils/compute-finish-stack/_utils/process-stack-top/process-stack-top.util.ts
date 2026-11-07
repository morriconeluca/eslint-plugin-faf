export function processStackTop(
  callStack: number[],
  edgeIndices: Int32Array,
  adjacency: readonly (readonly number[])[],
  visited: Uint8Array,
  finishStack: number[]
): void {
  const currentNode = callStack.at(-1);
  if (currentNode === undefined) {
    return;
  }
  const neighbors = adjacency[currentNode] ?? [];
  const currentEdgeIndex = edgeIndices[currentNode] ?? 0;

  if (currentEdgeIndex < neighbors.length) {
    edgeIndices[currentNode] = currentEdgeIndex + 1;
    const nextNode = neighbors[currentEdgeIndex] ?? 0;
    if (visited[nextNode] === 0) {
      visited[nextNode] = 1;
      callStack.push(nextNode);
    }
  } else {
    callStack.pop();
    finishStack.push(currentNode);
  }
}
