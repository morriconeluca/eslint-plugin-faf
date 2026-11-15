import type { TRawInventoryEntry } from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TBuildInventoryResult,
  TInProgressInventoryEntry,
} from './build-inventory.type.js';

import { toPosixPath } from '../../../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { collectSymlinkOutcomes } from './_utils/collect-symlink-outcomes/index.js';
import { groupTreeNodes } from './_utils/group-tree-nodes/index.js';
import { populateEntryMap } from './_utils/populate-entry-map/index.js';
import { resolveTreeOrigin } from './_utils/resolve-tree-origin/index.js';
import { traverseInventoryTree } from './_utils/traverse-inventory-tree/index.js';

export function buildInventory(
  entries: readonly TRawInventoryEntry[],
  origins: readonly string[]
): TBuildInventoryResult {
  const normalizedOrigins = origins.map((rawOrigin) => {
    const posix = toPosixPath(rawOrigin);
    const withoutPrefix = posix.startsWith('./') ? posix.slice(2) : posix;
    return withoutPrefix.endsWith('/') && withoutPrefix.length > 1
      ? withoutPrefix.slice(0, -1)
      : withoutPrefix;
  });

  const filteredEntries: TInProgressInventoryEntry[] = [];
  for (const entry of entries) {
    const treeOrigin = resolveTreeOrigin(entry.path, normalizedOrigins);
    if (treeOrigin !== null) {
      filteredEntries.push({
        isSymlink: entry.isSymlink,
        kind: entry.kind,
        path: entry.path,
        realPath: entry.realPath,
        treeOrigin,
      });
    }
  }

  const entryMap = populateEntryMap(filteredEntries, normalizedOrigins);
  const { childrenMap, roots } = groupTreeNodes(entryMap);
  const inventory = traverseInventoryTree(entryMap, roots, childrenMap);
  const outcomes = collectSymlinkOutcomes(inventory.items);

  return { inventory, outcomes };
}
