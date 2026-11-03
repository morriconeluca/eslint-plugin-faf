import type { TImportResolution } from '../../../../../_graph/_types/dependency-graph.type.js';

import { toPosixPath } from '../../../../../_domain/_utils/to-posix-path/index.js';

export function collectUnvisitedLocalPaths(
  resolutions: readonly TImportResolution[],
  visited: ReadonlySet<string>
): readonly string[] {
  const reachable: string[] = [];
  for (const resolution of resolutions) {
    if (resolution.target.type !== 'local-file') {
      continue;
    }

    const path = toPosixPath(resolution.target.path);
    if (!visited.has(path) && !reachable.includes(path)) {
      reachable.push(path);
    }
  }
  return reachable;
}
