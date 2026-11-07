export function findSelfLoopWitness(
  sortedComponent: readonly number[],
  selfLoopSet: ReadonlySet<number>,
  indexToPath: readonly string[]
): null | readonly string[] {
  for (const nodeIndex of sortedComponent) {
    if (selfLoopSet.has(nodeIndex)) {
      const pathString = indexToPath[nodeIndex];
      return pathString === undefined ? null : [pathString, pathString];
    }
  }
  return null;
}
