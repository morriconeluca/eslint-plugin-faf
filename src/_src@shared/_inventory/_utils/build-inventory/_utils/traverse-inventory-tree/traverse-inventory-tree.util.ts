import type {
  TInventory,
  TInventoryItem,
} from '../../../../_types/inventory.type.js';
import type { TInProgressInventoryEntry } from '../../_build-inventory@shared/_types/build-inventory.type.js';

export function traverseInventoryTree(
  entryMap: ReadonlyMap<string, TInProgressInventoryEntry>,
  roots: readonly string[],
  childrenMap: ReadonlyMap<string, readonly string[]>
): TInventory {
  let nextId = 0;
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();

  const visit = (
    currentPath: string,
    parentId: null | number,
    depth: number
  ): void => {
    const raw = entryMap.get(currentPath);
    if (raw === undefined) {
      return;
    }

    const id = nextId;
    nextId += 1;
    const preorderStart = id;

    const children = childrenMap.get(currentPath) ?? [];
    for (const childPath of children) {
      visit(childPath, id, depth + 1);
    }

    const preorderEnd = nextId - 1;

    const item: TInventoryItem = {
      depth,
      id,
      isSymlink: raw.isSymlink,
      kind: raw.kind,
      parentId,
      path: raw.path,
      preorderEnd,
      preorderStart,
      realPath: raw.realPath,
      treeOrigin: raw.treeOrigin,
    };

    items[id] = item;
    pathToId.set(item.path, id);

    if (!item.isSymlink || !realPathToId.has(item.realPath)) {
      realPathToId.set(item.realPath, id);
    }
  };

  for (const rootPath of roots) {
    visit(rootPath, null, 0);
  }

  return { items, pathToId, realPathToId };
}
