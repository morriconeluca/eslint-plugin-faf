export function reconstructTreeCycle(
  start: number,
  lastNode: number,
  parent: Int32Array
): readonly number[] {
  const reversedTrees: number[] = [];
  let trace = lastNode;
  while (trace !== start && trace !== -1) {
    reversedTrees.push(trace);
    trace = parent[trace] ?? -1;
  }
  reversedTrees.push(start);
  reversedTrees.reverse();
  reversedTrees.push(start);
  return reversedTrees;
}
