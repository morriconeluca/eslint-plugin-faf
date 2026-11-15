export function collectSccComponent(
  root: number,
  revAdjacency: readonly (readonly number[])[],
  visited: Uint8Array
): readonly number[] {
  const component: number[] = [];
  const stack = [root];
  visited[root] = 1;

  let current = stack.pop();
  while (current !== undefined) {
    component.push(current);
    const neighbors = revAdjacency[current];
    if (neighbors === undefined) {
      current = stack.pop();
      continue;
    }
    for (const neighbor of neighbors) {
      if (visited[neighbor] === 1) {
        continue;
      }
      visited[neighbor] = 1;
      stack.push(neighbor);
    }
    current = stack.pop();
  }

  return component;
}
