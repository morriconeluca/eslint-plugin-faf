import { describe, expect, it } from 'vitest';

import type { TInProgressInventoryEntry } from '../../_build-inventory@shared/_types/build-inventory.type.js';

import { populateEntryMap } from './index.js';

describe('populateEntryMap', () => {
  it('populates map with filtered entries and missing origin directory', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/main.ts',
        realPath: 'src/main.ts',
        treeOrigin: 'src',
      },
    ];

    const map = populateEntryMap(entries, ['src']);
    expect(map.has('src')).toBe(true);
    expect(map.get('src')?.isSymlink).toBe(false);
    expect(map.get('src')?.kind).toBe('directory');
    expect(map.has('src/main.ts')).toBe(true);
  });

  it('does not overwrite origin directory when already present in entries', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: true,
        kind: 'directory',
        path: 'src',
        realPath: 'src',
        treeOrigin: 'src',
      },
    ];

    const map = populateEntryMap(entries, ['src']);
    expect(map.get('src')?.isSymlink).toBe(true);
  });

  it('synthesizes intermediate ancestor paths but stops at multi-segment treeOrigin', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'apps/web/sub/file.ts',
        realPath: 'apps/web/sub/file.ts',
        treeOrigin: 'apps/web',
      },
    ];

    const map = populateEntryMap(entries, ['apps/web']);
    expect(map.has('apps/web/sub')).toBe(true);
    expect(map.get('apps/web/sub')?.isSymlink).toBe(false);
    expect(map.get('apps/web/sub')?.kind).toBe('directory');
    expect(map.has('apps/web')).toBe(true);
    expect(map.has('apps')).toBe(false);
  });

  it('does not overwrite existing intermediate directory during ancestor synthesis', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: true,
        kind: 'directory',
        path: 'src/a',
        realPath: 'custom/a',
        treeOrigin: 'src',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/a/b.ts',
        realPath: 'src/a/b.ts',
        treeOrigin: 'src',
      },
    ];

    const map = populateEntryMap(entries, ['src']);
    expect(map.get('src/a')?.isSymlink).toBe(true);
    expect(map.get('src/a')?.realPath).toBe('custom/a');
  });

  it('deduplicates identical paths keeping first item', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/file.ts',
        realPath: 'first',
        treeOrigin: 'src',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/file.ts',
        realPath: 'second',
        treeOrigin: 'src',
      },
    ];

    const map = populateEntryMap(entries, ['src']);
    expect(map.get('src/file.ts')?.realPath).toBe('first');
  });
});
