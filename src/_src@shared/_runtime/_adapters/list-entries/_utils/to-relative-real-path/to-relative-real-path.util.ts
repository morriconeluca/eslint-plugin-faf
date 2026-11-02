import path from 'node:path';

export function toRelativeRealPath(
  rawRealPathAbsolute: string,
  resolvedBaseDirectory: string
): string {
  const normalizedReal = rawRealPathAbsolute.replaceAll('\\', '/');
  const normalizedBase = resolvedBaseDirectory.replaceAll('\\', '/');
  const relative = path.posix.relative(normalizedBase, normalizedReal);
  if (relative.startsWith('..') || path.posix.isAbsolute(relative)) {
    return normalizedReal;
  }
  if (relative === '') {
    return '.';
  }
  return relative;
}
