import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../_src@shared/_types/faf-config.type.js';
import type {
  TInventoryItem,
  TRawInventoryEntry,
} from '../../_conformity@shared/_types/verification-model.type.js';
import type { TInProgressInventoryEntry } from './build-inventory.type.js';

import { buildInventory } from './build-inventory.stage.js';
import {
  assembleInventory,
  collectSymlinkOutcomes,
  groupTreeNodes,
  populateEntryMap,
  resolveTreeOrigin,
  traverseInventoryTree,
} from './build-inventory.util.js';

const baseConfig: TFAFConfig = {
  faf: {
    locals: [
      {
        roles: [{ category: '_utils', name: 'util' }],
        rootLayers: ['src'],
      },
    ],
  },
};

describe('buildInventory', () => {
  it('returns outcomes when a declared origin cannot be listed', async () => {
    const fixture = await createFixture({
      'package.json': JSON.stringify({ type: 'module' }),
    });
    try {
      const result = buildInventory({
        baseDirectory: fixture.path,
        config: baseConfig,
        origins: ['missing'],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.outcomes.length).toBeGreaterThan(0);
        expect(result.outcomes[0]?.family).toBe('configuration');
      }
    } finally {
      await fixture.rm();
    }
  });

  it('builds inventory, includes external targets, and collects symlink outcomes on disk', async () => {
    const fixture = await createFixture({
      'external/helper.ts': 'export const helper = 1;\n',
      'src/real.ts': 'export const real = 1;\n',
    });
    await nodeFs.promises.symlink(
      nodePath.join(fixture.path, 'src/real.ts'),
      nodePath.join(fixture.path, 'src/link.ts')
    );
    try {
      const result = buildInventory({
        baseDirectory: fixture.path,
        config: baseConfig,
        origins: ['src'],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.inventory.pathToId.has('src/real.ts')).toBe(true);
        expect(result.value.inventory.pathToId.has('src/link.ts')).toBe(true);
        expect(result.value.inventory.pathToId.has('external/helper.ts')).toBe(
          true
        );
        expect(result.value.inventoryOutcomes).toHaveLength(1);
        expect(result.value.inventoryOutcomes[0]?.constraint).toBe(
          'unverified/symbolic-link'
        );
      }
    } finally {
      await fixture.rm();
    }
  });

  it('builds an empty inventory with empty outcomes when no entries or origins are given', () => {
    const result = assembleInventory([], []);
    expect(result.inventory.items).toEqual([]);
    expect(result.inventory.pathToId.size).toBe(0);
    expect(result.inventory.realPathToId.size).toBe(0);
    expect(result.outcomes).toEqual([]);
  });

  it('excludes files outside tree origins from the inventory model', () => {
    const entries: readonly TRawInventoryEntry[] = [
      { isSymlink: false, kind: 'directory', path: 'src', realPath: 'src' },
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

    const result = assembleInventory(entries, ['src']);
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
    const entries: readonly TRawInventoryEntry[] = [
      { isSymlink: false, kind: 'directory', path: 'src', realPath: 'src' },
      {
        isSymlink: false,
        kind: 'directory',
        path: 'src/utils',
        realPath: 'src/utils',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/utils/alpha.ts',
        realPath: 'src/utils/alpha.ts',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/utils/beta.ts',
        realPath: 'src/utils/beta.ts',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/main.ts',
        realPath: 'src/main.ts',
      },
    ];

    const reversed = [...entries];
    reversed.reverse();
    const shuffled = [
      entries[2],
      entries[4],
      entries[0],
      entries[3],
      entries[1],
    ].filter((entry): entry is TRawInventoryEntry => entry !== undefined);

    const result1 = assembleInventory(entries, ['src']);
    const result2 = assembleInventory(reversed, ['src']);
    const result3 = assembleInventory(shuffled, ['src']);

    expect(result1.inventory.items).toEqual(result2.inventory.items);
    expect(result1.inventory.items).toEqual(result3.inventory.items);
    expect(result1.inventory.pathToId).toEqual(result2.inventory.pathToId);
  });

  it('produces an unverified outcome for symbolic links inside trees with physical realpath', () => {
    const entries: readonly TRawInventoryEntry[] = [
      { isSymlink: false, kind: 'directory', path: 'src', realPath: 'src' },
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

    const result = assembleInventory(entries, ['src']);
    expect(result.outcomes).toEqual([
      {
        constraint: 'unverified/symbolic-link',
        element: 'src/link.ts',
        family: 'unverified',
        message: "'src/link.ts' is a symbolic link within a tree: src/real.ts",
        normativeReference: 'FAF §3, §6.9',
        reason: 'src/real.ts',
      },
    ]);

    const linkItem = result.inventory.items.find(
      (item) => item.path === 'src/link.ts'
    );
    expect(linkItem?.isSymlink).toBe(true);
    expect(linkItem?.realPath).toBe('src/real.ts');
  });

  it('synthesizes intermediate directories, handles multi-segment origins, and indexes depths', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'apps/web/a/b/c.ts',
        realPath: 'apps/web/a/b/c.ts',
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

    const result = assembleInventory(entries, ['libs', 'apps/web']);
    const paths = result.inventory.items.map((item) => item.path);

    expect(paths).toContain('apps/web');
    expect(paths).toContain('apps/web/a');
    expect(paths).toContain('apps/web/a/b');
    expect(paths).toContain('apps/web/a/b/c.ts');
    expect(paths).not.toContain('apps');

    const rootApps = result.inventory.items.find(
      (item) => item.path === 'apps/web'
    );
    const rootLibs = result.inventory.items.find(
      (item) => item.path === 'libs'
    );
    expect(rootApps?.depth).toBe(0);
    expect(rootApps?.treeOrigin).toBe('apps/web');
    expect(rootLibs?.depth).toBe(0);
    expect(rootLibs?.treeOrigin).toBe('libs');
  });

  it('normalizes origin paths with leading dot-slash or trailing slash and deduplicates identical paths', () => {
    const entries: readonly TRawInventoryEntry[] = [
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/index.ts',
        realPath: 'first',
      },
      {
        isSymlink: false,
        kind: 'file',
        path: 'src/index.ts',
        realPath: 'second',
      },
    ];

    const result = assembleInventory(entries, ['./src/']);
    expect(result.inventory.items[0]?.path).toBe('src');
    expect(result.inventory.items[0]?.treeOrigin).toBe('src');
    expect(result.inventory.items[1]?.realPath).toBe('first');

    const slashResult = assembleInventory([], ['/']);
    expect(slashResult.inventory.items[0]?.path).toBe('/');
  });

  it('resolves tree origins across overlapping, dot, and non-matching prefixes', () => {
    expect(resolveTreeOrigin('src/index.ts', [])).toBeNull();
    expect(resolveTreeOrigin('src', ['src', 'lib'])).toBe('src');
    expect(resolveTreeOrigin('src2/index.ts', ['src'])).toBeNull();
    expect(resolveTreeOrigin('anything/deep/file.ts', ['.'])).toBe('.');
    expect(resolveTreeOrigin('apps/blog/post.ts', ['apps', 'apps/blog'])).toBe(
      'apps/blog'
    );
    expect(resolveTreeOrigin('apps/blog/post.ts', ['apps/blog', 'apps'])).toBe(
      'apps/blog'
    );
  });

  it('preserves existing origin and intermediate entries in populateEntryMap', () => {
    const entries: readonly TInProgressInventoryEntry[] = [
      {
        isSymlink: true,
        kind: 'directory',
        path: 'src',
        realPath: 'src',
        treeOrigin: 'src',
      },
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
    expect(map.get('src')?.isSymlink).toBe(true);
    expect(map.get('src/a')?.isSymlink).toBe(true);
    expect(map.get('src/a')?.realPath).toBe('custom/a');
  });

  it('groups dot-root children and sorts roots and child names by UTF-16 code units', () => {
    const dotMap = new Map<string, TInProgressInventoryEntry>([
      [
        '.',
        {
          isSymlink: false,
          kind: 'directory',
          path: '.',
          realPath: '.',
          treeOrigin: '.',
        },
      ],
      [
        'root.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'root.ts',
          realPath: 'root.ts',
          treeOrigin: '.',
        },
      ],
    ]);
    const dotGrouped = groupTreeNodes(dotMap);
    expect(dotGrouped.roots).toEqual(['.']);
    expect(dotGrouped.childrenMap.get('.')).toEqual(['root.ts']);

    const orderedMap = new Map<string, TInProgressInventoryEntry>([
      [
        '_tree',
        {
          isSymlink: false,
          kind: 'directory',
          path: '_tree',
          realPath: '_tree',
          treeOrigin: '_tree',
        },
      ],
      [
        'btree',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'btree',
          realPath: 'btree',
          treeOrigin: 'btree',
        },
      ],
      [
        'Btree',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'Btree',
          realPath: 'Btree',
          treeOrigin: 'Btree',
        },
      ],
      [
        'src',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'src',
          realPath: 'src',
          treeOrigin: 'src',
        },
      ],
      [
        'src/_a.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/_a.ts',
          realPath: 'src/_a.ts',
          treeOrigin: 'src',
        },
      ],
      [
        'src/b.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/b.ts',
          realPath: 'src/b.ts',
          treeOrigin: 'src',
        },
      ],
    ]);
    const grouped = groupTreeNodes(orderedMap);
    expect(grouped.roots).toEqual(['Btree', '_tree', 'btree', 'src']);
    expect(grouped.childrenMap.get('src')).toEqual(['src/_a.ts', 'src/b.ts']);
  });

  it('handles missing roots, preorder intervals, and realPathToId precedence during traversal', () => {
    expect(
      traverseInventoryTree(new Map(), ['missing-root'], new Map()).items
    ).toEqual([]);

    const entryMap = new Map<string, TInProgressInventoryEntry>([
      [
        'src',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'src',
          realPath: 'src',
          treeOrigin: 'src',
        },
      ],
      [
        'src/first-link.ts',
        {
          isSymlink: true,
          kind: 'file',
          path: 'src/first-link.ts',
          realPath: '/outside/same.ts',
          treeOrigin: 'src',
        },
      ],
      [
        'src/link.ts',
        {
          isSymlink: true,
          kind: 'file',
          path: 'src/link.ts',
          realPath: 'src/target.ts',
          treeOrigin: 'src',
        },
      ],
      [
        'src/second-link.ts',
        {
          isSymlink: true,
          kind: 'file',
          path: 'src/second-link.ts',
          realPath: '/outside/same.ts',
          treeOrigin: 'src',
        },
      ],
      [
        'src/target.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/target.ts',
          realPath: 'src/target.ts',
          treeOrigin: 'src',
        },
      ],
    ]);
    const childrenMap = new Map<string, string[]>([
      [
        'src',
        [
          'src/first-link.ts',
          'src/link.ts',
          'src/second-link.ts',
          'src/target.ts',
        ],
      ],
    ]);

    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);
    expect(inventory.items[0]?.preorderStart).toBe(0);
    expect(inventory.items[0]?.preorderEnd).toBe(4);
    expect(inventory.realPathToId.get('/outside/same.ts')).toBe(
      inventory.pathToId.get('src/first-link.ts')
    );
    expect(inventory.realPathToId.get('src/target.ts')).toBe(
      inventory.pathToId.get('src/target.ts')
    );
  });

  it('ignores external symlinks in collectSymlinkOutcomes', () => {
    const externalSymlink: TInventoryItem = {
      depth: 0,
      id: 0,
      isSymlink: true,
      kind: 'file',
      parentId: null,
      path: 'scripts/link.ts',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: 'scripts/real.ts',
      treeOrigin: null,
    };
    expect(collectSymlinkOutcomes([externalSymlink])).toEqual([]);
  });
});
