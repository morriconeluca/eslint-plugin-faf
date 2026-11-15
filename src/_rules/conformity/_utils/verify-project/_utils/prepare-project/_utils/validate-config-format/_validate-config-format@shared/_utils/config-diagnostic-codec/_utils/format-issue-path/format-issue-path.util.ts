export function formatIssuePath(segments: readonly PropertyKey[]): string {
  let path = '';
  for (const segment of segments) {
    if (typeof segment === 'number') {
      path += `[${segment}]`;
    } else if (typeof segment === 'string' && path.length === 0) {
      path += segment;
    } else {
      path += `.${String(segment)}`;
    }
  }
  return path;
}
