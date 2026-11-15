export function deduplicateNeighborRow(
  row: readonly number[]
): readonly number[] {
  const sorted = [...row];
  sorted.sort((a, b) => a - b);
  const deduped: number[] = [];
  for (const neighbor of sorted) {
    if (deduped.at(-1) !== neighbor) {
      deduped.push(neighbor);
    }
  }
  return deduped;
}
