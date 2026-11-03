export function toPosixPath(rawPath: string): string {
  return rawPath.replaceAll('\\', '/');
}
