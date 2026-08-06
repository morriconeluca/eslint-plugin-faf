import path from 'path';

/**
 * Returns the owner of the closest Fractal Branch ancestor, or null.
 */
export function getFractalBranchOwner(relPath: string): null | string {
  let current = relPath;
  while (current && current !== '.' && current !== '/') {
    const folderName = path.basename(current);
    if (folderName.startsWith('_') && folderName.includes('@shared')) {
      return path.dirname(current).replace(/\\/g, '/');
    }
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}
