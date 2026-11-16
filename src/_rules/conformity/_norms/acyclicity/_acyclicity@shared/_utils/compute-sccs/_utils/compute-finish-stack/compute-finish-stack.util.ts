export function computeFinishStack(
  nodeCount: number,
  adjacency: readonly (readonly number[])[]
): readonly number[] {
  type TStackFrame = {
    edgeIndex: number;
    readonly node: number;
  };

  const visited = new Uint8Array(nodeCount);
  const finishStack: number[] = [];

  const processStackTop = (
    top: TStackFrame,
    callStack: TStackFrame[]
  ): void => {
    const neighbors = adjacency[top.node] ?? [];

    if (top.edgeIndex < neighbors.length) {
      const nextNode = neighbors[top.edgeIndex];
      top.edgeIndex += 1;
      if (nextNode !== undefined && visited[nextNode] === 0) {
        visited[nextNode] = 1;
        callStack.push({ edgeIndex: 0, node: nextNode });
      }
    } else {
      callStack.pop();
      finishStack.push(top.node);
    }
  };

  for (let root = 0; root < nodeCount; root += 1) {
    if (visited[root] === 1) {
      continue;
    }
    visited[root] = 1;
    const callStack: TStackFrame[] = [{ edgeIndex: 0, node: root }];

    let top = callStack.at(-1);
    while (top !== undefined) {
      processStackTop(top, callStack);
      top = callStack.at(-1);
    }
  }

  return finishStack;
}
