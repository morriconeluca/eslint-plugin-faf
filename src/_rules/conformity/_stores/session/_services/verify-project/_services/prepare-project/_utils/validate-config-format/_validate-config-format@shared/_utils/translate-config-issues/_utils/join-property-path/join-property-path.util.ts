export function joinPropertyPath(prefix: string, relativePath: string): string {
  if (relativePath.length === 0) {
    return prefix;
  }
  if (prefix.length === 0) {
    return relativePath;
  }
  return relativePath.startsWith('[')
    ? `${prefix}${relativePath}`
    : `${prefix}.${relativePath}`;
}
