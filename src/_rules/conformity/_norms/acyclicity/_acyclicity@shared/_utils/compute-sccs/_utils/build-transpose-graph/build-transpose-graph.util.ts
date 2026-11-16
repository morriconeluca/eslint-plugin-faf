export function buildTransposeGraph(
  nodeCount: number,
  adjacency: readonly (readonly number[])[]
): readonly (readonly number[])[] {
  const reverseAdjacency: number[][] = Array.from(
    { length: nodeCount },
    () => []
  );

  for (let sourceVertex = 0; sourceVertex < nodeCount; sourceVertex += 1) {
    const neighbors = adjacency[sourceVertex];
    if (neighbors === undefined) {
      continue;
    }
    for (const targetVertex of neighbors) {
      const row = reverseAdjacency[targetVertex];
      if (row !== undefined) {
        row.push(sourceVertex);
      }
    }
  }

  return reverseAdjacency;
}
