import type {
  TGroupTreeNodesResult,
  TInProgressInventoryEntry,
} from '../../_build-inventory@shared/_types/build-inventory.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

export function groupTreeNodes(
  entryMap: ReadonlyMap<string, TInProgressInventoryEntry>
): TGroupTreeNodesResult {
  const roots: string[] = [];
  const childrenMap = new Map<string, string[]>();

  for (const [path, item] of entryMap) {
    if (path === item.treeOrigin) {
      roots.push(path);
      continue;
    }

    const lastSlash = path.lastIndexOf('/');
    const parentPath =
      lastSlash === -1 ? item.treeOrigin : path.slice(0, lastSlash);
    const siblings = childrenMap.get(parentPath);
    if (siblings === undefined) {
      childrenMap.set(parentPath, [path]);
    } else {
      siblings.push(path);
    }
  }

  roots.sort(compareOrdinal);

  for (const children of childrenMap.values()) {
    children.sort((left, right) =>
      compareOrdinal(
        left.slice(left.lastIndexOf('/') + 1),
        right.slice(right.lastIndexOf('/') + 1)
      )
    );
  }

  return { childrenMap, roots };
}
