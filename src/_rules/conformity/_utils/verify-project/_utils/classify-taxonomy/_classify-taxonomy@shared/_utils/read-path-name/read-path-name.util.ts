export function readPathName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}
