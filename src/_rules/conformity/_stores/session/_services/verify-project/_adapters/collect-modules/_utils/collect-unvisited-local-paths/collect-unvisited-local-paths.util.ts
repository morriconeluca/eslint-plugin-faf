import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { toPosixPath } from '../../../../../../_session@shared/_utils/to-posix-path/index.js';

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
