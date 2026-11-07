export function isAuthEdgeValid(
  u: number,
  v: number,
  seenEdges: ReadonlySet<string>
): boolean {
  if (u === v) {
    return false;
  }
  const key = `${u}\0${v}`;
  return !seenEdges.has(key);
}
