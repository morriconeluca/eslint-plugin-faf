import { describe, expect, it } from 'vitest';

import type { TRawInventoryEntry } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { buildInventory } from './index.js';

describe('buildInventory', () => {
  it('builds an empty inventory with empty outcomes when no entries or origins are given', () => {
    const result = buildInventory([], []);
    expect(result.inventory.items).toEqual([]);
    expect(result.inventory.pathToId.size).toBe(0);
    expect(result.inventory.realPathToId.size).toBe(0);
    expect(result.outcomes).toEqual([]);
  });

  it('excludes files outside tree origins from the inventory model', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'directory',
        path: 'src',
        realPath: 'src',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/main.ts',
        realPath: 'src/main.ts',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'scripts/build-tool.ts',
        realPath: 'scripts/build-tool.ts',
      },
    ];

    const result = buildInventory(entries, ['src']);
    const paths = result.inventory.items.map((item) => item.path);

    expect(paths).toContain('src');
    expect(paths).toContain('src/main.ts');
    expect(paths).not.toContain('scripts/build-tool.ts');
    expect(result.inventory.pathToId.has('scripts/build-tool.ts')).toBe(false);
    expect(result.inventory.realPathToId.has('scripts/build-tool.ts')).toBe(
      false
    );
  });

  it('produces identical inventory regardless of the input entry order', () => {
    const entryA: TRawInventoryEntry = {
      isSymlink: false,
      kind: 'directory',
      path: 'src',
      realPath: 'src',
    };
    const entryB: TRawInventoryEntry = {
      isSymlink: false,
      kind: 'directory',
      path: 'src/utils',
      realPath: 'src/utils',
    };
    const entryC: TRawInventoryEntry = {
      isSymlink: false,
      kind: 'file',
      path: 'src/utils/alpha.ts',
      realPath: 'src/utils/alpha.ts',
    };
    const entryD: TRawInventoryEntry = {
      isSymlink: false,
      kind: 'file',
      path: 'src/utils/beta.ts',
      realPath: 'src/utils/beta.ts',
    };
    const entryE: TRawInventoryEntry = {
      isSymlink: false,
      kind: 'file',
      path: 'src/main.ts',
      realPath: 'src/main.ts',
    };

    const forwardOrder = [entryA, entryB, entryC, entryD, entryE];
    const reverseOrder = [entryE, entryD, entryC, entryB, entryA];
    const shuffledOrder = [entryC, entryE, entryA, entryD, entryB];

    const result1 = buildInventory(forwardOrder, ['src']);
    const result2 = buildInventory(reverseOrder, ['src']);
    const result3 = buildInventory(shuffledOrder, ['src']);

    expect(result1.inventory.items).toEqual(result2.inventory.items);
    expect(result1.inventory.items).toEqual(result3.inventory.items);
    expect(result1.inventory.pathToId).toEqual(result2.inventory.pathToId);
  });

  it('produces an unverified outcome for symbolic links inside trees with physical realpath', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'directory',
        path: 'src',
        realPath: 'src',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/real.ts',
        realPath: 'src/real.ts',
      },
      {
        isSymlink: true,
        kind: 'file',
        path: 'src/link.ts',
        realPath: 'src/real.ts',
      },
    ];

    const result = buildInventory(entries, ['src']);

    expect(result.outcomes).toHaveLength(1);
    expect(result.outcomes[0]).toEqual({
      constraint: 'unverified/symbolic-link',
      element: 'src/link.ts',
      family: 'unverified',
      message:
        "Symbolic link 'src/link.ts' within tree creates ambiguous physical identity (resolves to 'src/real.ts').",
      normativeReference: '§6',
      reason: 'src/real.ts',
    });

    const linkItem = result.inventory.items.find(
      (item) => item.path === 'src/link.ts'
    );
    expect(linkItem?.isSymlink).toBe(true);
    expect(linkItem?.realPath).toBe('src/real.ts');
  });

  it('synthesizes intermediate directories when sparse entries are passed', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/a/b/c.ts',
        realPath: 'src/a/b/c.ts',
      },
    ];

    const result = buildInventory(entries, ['src']);
    const paths = result.inventory.items.map((item) => item.path);

    expect(paths).toContain('src');
    expect(paths).toContain('src/a');
    expect(paths).toContain('src/a/b');
    expect(paths).toContain('src/a/b/c.ts');
  });

  it('indexes multiple tree origins with dense preorder integers and correct depths', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'directory',
        path: 'apps',
        realPath: 'apps',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'apps/index.ts',
        realPath: 'apps/index.ts',
      },
      {
        isSymlink: false,
        kind: 'directory',
        path: 'libs',
        realPath: 'libs',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'libs/index.ts',
        realPath: 'libs/index.ts',
      },
    ];

    const result = buildInventory(entries, ['libs', 'apps']);
    expect(result.inventory.items).toHaveLength(4);

    const rootApps = result.inventory.items.find(
      (item) => item.path === 'apps'
    );
    const rootLibs = result.inventory.items.find(
      (item) => item.path === 'libs'
    );

    expect(rootApps?.depth).toBe(0);
    expect(rootApps?.treeOrigin).toBe('apps');
    expect(rootLibs?.depth).toBe(0);
    expect(rootLibs?.treeOrigin).toBe('libs');
  });

  it('normalizes origin paths with leading dot-slash or trailing slash', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/index.ts',
        realPath: 'src/index.ts',
      },
    ];

    const result = buildInventory(entries, ['./src/']);
    const root = result.inventory.items[0];

    expect(root?.path).toBe('src');
    expect(root?.treeOrigin).toBe('src');
  });

  it('deduplicates entries with identical paths by keeping first occurrence', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/dup.ts',
        realPath: 'src/dup.ts',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/dup.ts',
        realPath: 'src/dup.ts',
      },
    ];

    const result = buildInventory(entries, ['src']);
    const matches = result.inventory.items.filter(
      (item) => item.path === 'src/dup.ts'
    );

    expect(matches).toHaveLength(1);
  });
});
