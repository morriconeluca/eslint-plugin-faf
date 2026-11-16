import type { TOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TInventory,
  TInventoryItem,
  TRawInventoryEntry,
} from '../../_conformity@shared/_types/verification-model.type.js';
import type {
  TAssembledInventoryResult,
  TGroupTreeNodesResult,
  TInProgressInventoryEntry,
} from './build-inventory.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { toPosixPath } from '../../../../_src@shared/_utils/to-posix-path/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';

export function assembleInventory(
  entries: readonly TRawInventoryEntry[],
  origins: readonly string[]
): TAssembledInventoryResult {
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

export function collectSymlinkOutcomes(
  items: readonly TInventoryItem[]
): readonly TOutcome[] {
  const outcomes: TOutcome[] = [];

  for (const item of items) {
    if (item.isSymlink && item.treeOrigin !== null) {
      outcomes.push(
        createOutcome.unverified('unverified/symbolic-link', {
          detail: item.realPath,
          element: item.path,
          reason: item.realPath,
        })
      );
    }
  }

  return outcomes;
}

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

export function resolveTreeOrigin(
  entryPath: string,
  normalizedOrigins: readonly string[]
): null | string {
  let matchedOrigin: null | string = null;

  for (const origin of normalizedOrigins) {
    if (origin === '.') {
      matchedOrigin = origin;
      continue;
    }

    if (
      (entryPath === origin || entryPath.startsWith(`${origin}/`)) &&
      (matchedOrigin === null || origin.length > matchedOrigin.length)
    ) {
      matchedOrigin = origin;
    }
  }

  return matchedOrigin;
}

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
