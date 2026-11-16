import type {
  TImportResolution,
  TInventory,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { toPosixPath } from '../../../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';

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

export function selectTreeFilePaths(inventory: TInventory): readonly string[] {
  const paths = new Set<string>();
  for (const item of inventory.items) {
    if (item.kind === 'file' && item.treeOrigin !== null) {
      paths.add(toPosixPath(item.path));
    }
  }
  const ordered = [...paths];
  ordered.sort(compareOrdinal);
  return ordered;
}
