export function isLibraryPath(path: string): boolean {
  return path.split('/').includes('node_modules');
}
