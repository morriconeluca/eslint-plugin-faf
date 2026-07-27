import fs from 'fs';
import path from 'path';

import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Returns a cached record of files and directories within a target directory path.
 * Limits disk access by caching results in `state.dirCache` on the first miss.
 * Performs a single fs.readdirSync operation to optimize synchronous I/O.
 *
 * @param relDirPath - Directory path relative to the project root.
 * @returns Object with arrays of directory names and file names.
 */
export function readDirCached(relDirPath: string): {
  dirs: string[];
  files: string[];
} {
  const absPath = path
    .resolve(state.projectRoot, relDirPath)
    .replace(/\\/g, '/');
  if (state.dirCache[absPath]) {
    return state.dirCache[absPath];
  }

  try {
    const entries = fs.readdirSync(absPath, { withFileTypes: true });
    const files: string[] = [];
    const dirs: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(entry.name);
      } else if (entry.isDirectory()) {
        dirs.push(entry.name);
      }
    }

    state.dirCache[absPath] = { dirs, files };
    return state.dirCache[absPath];
  } catch {
    return { dirs: [], files: [] };
  }
}
