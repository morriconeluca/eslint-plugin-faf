import type {
  TGroupTreeNodesResult,
  TInProgressInventoryEntry,
} from '../../_build-inventory@shared/_types/build-inventory.type.js';

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

  roots.sort((a, b) => a.localeCompare(b));

  for (const children of childrenMap.values()) {
    children.sort((pathA, pathB) => {
      const nameA = pathA.slice(pathA.lastIndexOf('/') + 1);
      const nameB = pathB.slice(pathB.lastIndexOf('/') + 1);
      return nameA.localeCompare(nameB);
    });
  }

  return { childrenMap, roots };
}
