import type { TInProgressInventoryEntry } from '../../_build-inventory@shared/_types/build-inventory.type.js';

export function populateEntryMap(
  filteredEntries: readonly TInProgressInventoryEntry[],
  normalizedOrigins: readonly string[]
): Map<string, TInProgressInventoryEntry> {
  const entryMap = new Map<string, TInProgressInventoryEntry>();

  for (const entry of filteredEntries) {
    if (!entryMap.has(entry.path)) {
      entryMap.set(entry.path, entry);
    }
  }

  for (const origin of normalizedOrigins) {
    if (!entryMap.has(origin)) {
      entryMap.set(origin, {
        isSymlink: false,
        kind: 'directory',
        path: origin,
        realPath: origin,
        treeOrigin: origin,
      });
    }
  }

  const initialItems: TInProgressInventoryEntry[] = [];
  entryMap.forEach((item) => {
    initialItems.push(item);
  });

  for (const item of initialItems) {
    let current = item.path;
    while (current !== item.treeOrigin && current.includes('/')) {
      const parentSlash = current.lastIndexOf('/');
      const parentPath = current.slice(0, parentSlash);
      if (!entryMap.has(parentPath)) {
        entryMap.set(parentPath, {
          isSymlink: false,
          kind: 'directory',
          path: parentPath,
          realPath: parentPath,
          treeOrigin: item.treeOrigin,
        });
      }
      current = parentPath;
    }
  }

  return entryMap;
}
