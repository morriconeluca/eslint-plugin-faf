export function buildTransposeGraph(
  nodeCount: number,
  adjacency: readonly (readonly number[])[]
): readonly (readonly number[])[] {
  const revAdjacency: number[][] = Array.from({ length: nodeCount }, () => []);

  for (let u = 0; u < nodeCount; u += 1) {
    const neighbors = adjacency[u];
    if (neighbors === undefined) {
      continue;
    }
    for (const v of neighbors) {
      const row = revAdjacency[v];
      if (row !== undefined) {
        row.push(u);
      }
    }
  }

  return revAdjacency;
}
