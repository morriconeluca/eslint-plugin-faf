import type {
  TInventory,
  TInventoryItem,
  TRawInventoryEntry,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { compareOrdinal } from '../../../../_verify-project@shared/_utils/compare-ordinal/index.js';

type TPreparedEntry = TRawInventoryEntry & {
  readonly treeOrigin: string;
};

const normalizeOrigin = (rawOrigin: string): string => {
  const posix = rawOrigin.replaceAll('\\', '/');
  const withoutPrefix = posix.startsWith('./') ? posix.slice(2) : posix;
  return withoutPrefix.endsWith('/') && withoutPrefix.length > 1
    ? withoutPrefix.slice(0, -1)
    : withoutPrefix;
};

const resolveTreeOrigin = (
  entryPath: string,
  origins: readonly string[]
): null | string => {
  let matchedOrigin: null | string = null;
  for (const origin of origins) {
    const isDot = origin === '.';
    const isPathMatch =
      entryPath === origin || entryPath.startsWith(`${origin}/`);
    const isLonger =
      matchedOrigin === null || origin.length > matchedOrigin.length;
    if (isDot || (isPathMatch && isLonger)) {
      matchedOrigin = origin;
    }
  }
  return matchedOrigin;
};

const preparedEntry = (
  path: string,
  treeOrigin: string,
  entry?: TRawInventoryEntry
): TPreparedEntry => ({
  isSymlink: entry?.isSymlink ?? false,
  kind: entry?.kind ?? 'directory',
  path,
  realPath: entry?.realPath ?? path,
  treeOrigin,
});

const addMissingParents = (entryMap: Map<string, TPreparedEntry>): void => {
  const initialItems = [...entryMap];
  for (const [, item] of initialItems) {
    let current = item.path;
    while (current !== item.treeOrigin && current.includes('/')) {
      const parentPath = current.slice(0, current.lastIndexOf('/'));
      if (!entryMap.has(parentPath)) {
        entryMap.set(parentPath, preparedEntry(parentPath, item.treeOrigin));
      }
      current = parentPath;
    }
  }
};

const prepareEntries = (
  entries: readonly TRawInventoryEntry[],
  origins: readonly string[]
): Map<string, TPreparedEntry> => {
  const entryMap = new Map<string, TPreparedEntry>();
  for (const entry of entries) {
    const treeOrigin = resolveTreeOrigin(entry.path, origins);
    if (treeOrigin !== null && !entryMap.has(entry.path)) {
      entryMap.set(entry.path, preparedEntry(entry.path, treeOrigin, entry));
    }
  }
  for (const origin of origins) {
    if (!entryMap.has(origin)) {
      entryMap.set(origin, preparedEntry(origin, origin));
    }
  }
  addMissingParents(entryMap);
  return entryMap;
};

const baseName = (path: string): string => {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? path : path.slice(slash + 1);
};

const groupNodes = (
  entryMap: ReadonlyMap<string, TPreparedEntry>
): {
  readonly childrenMap: ReadonlyMap<string, readonly string[]>;
  readonly roots: readonly string[];
} => {
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
    const siblings = childrenMap.get(parentPath) ?? [];
    childrenMap.set(parentPath, [...siblings, path]);
  }
  roots.sort(compareOrdinal);
  for (const [parentPath, children] of childrenMap) {
    const ordered = [...children];
    ordered.sort((left, right) =>
      compareOrdinal(baseName(left), baseName(right))
    );
    childrenMap.set(parentPath, ordered);
  }
  return { childrenMap, roots };
};

const visitEntry = (
  entryMap: ReadonlyMap<string, TPreparedEntry>,
  childrenMap: ReadonlyMap<string, readonly string[]>,
  items: TInventoryItem[],
  pathToId: Map<string, number>,
  realPathToId: Map<string, number>,
  currentPath: string,
  parentId: null | number,
  depth: number,
  nextId: { value: number }
): void => {
  const raw = entryMap.get(currentPath);
  if (raw === undefined) {
    return;
  }
  const id = nextId.value;
  nextId.value += 1;
  const children = childrenMap.get(currentPath) ?? [];
  for (const childPath of children) {
    visitEntry(
      entryMap,
      childrenMap,
      items,
      pathToId,
      realPathToId,
      childPath,
      id,
      depth + 1,
      nextId
    );
  }
  const item: TInventoryItem = {
    depth,
    id,
    isSymlink: raw.isSymlink,
    kind: raw.kind,
    parentId,
    path: raw.path,
    preorderEnd: nextId.value - 1,
    preorderStart: id,
    realPath: raw.realPath,
    treeOrigin: raw.treeOrigin,
  };
  items[id] = item;
  pathToId.set(item.path, id);
  if (!item.isSymlink || !realPathToId.has(item.realPath)) {
    realPathToId.set(item.realPath, id);
  }
};

export function inventoryFromEntries(
  entries: readonly TRawInventoryEntry[],
  rawOrigins: readonly string[]
): TInventory {
  const origins = rawOrigins.map((origin) => normalizeOrigin(origin));
  const entryMap = prepareEntries(entries, origins);
  const { childrenMap, roots } = groupNodes(entryMap);
  const items: TInventoryItem[] = [];
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  const nextId = { value: 0 };
  for (const rootPath of roots) {
    visitEntry(
      entryMap,
      childrenMap,
      items,
      pathToId,
      realPathToId,
      rootPath,
      null,
      0,
      nextId
    );
  }
  return { items, pathToId, realPathToId };
}
