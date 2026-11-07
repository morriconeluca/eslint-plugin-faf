import { describe, expect, it } from 'vitest';

import type { TInProgressInventoryEntry } from '../../_build-inventory@shared/_types/build-inventory.type.js';

import { traverseInventoryTree } from './traverse-inventory-tree.util.js';

describe('traverseInventoryTree', () => {
  it('returns empty inventory when roots array is empty', () => {
    const entryMap = new Map<string, TInProgressInventoryEntry>();
    const childrenMap = new Map<string, string[]>();
    const inventory = traverseInventoryTree(entryMap, [], childrenMap);

    expect(inventory.items).toEqual([]);
    expect(inventory.pathToId.size).toBe(0);
    expect(inventory.realPathToId.size).toBe(0);
  });

  it('indexes a single root directory item with depth 0 and null parentId', () => {
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
    ]);
    const childrenMap = new Map<string, string[]>();
    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);

    expect(inventory.items).toHaveLength(1);
    expect(inventory.items[0]).toEqual({
      depth: 0,
      id: 0,
      isSymlink: false,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 0,
      preorderStart: 0,
      realPath: 'src',
      treeOrigin: 'src',
    });
    expect(inventory.pathToId.get('src')).toBe(0);
    expect(inventory.realPathToId.get('src')).toBe(0);
  });

  it('computes exact preorder intervals and depths for a tree with nested children', () => {
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
        'src/components',
        {
          isSymlink: false,
          kind: 'directory',
          path: 'src/components',
          realPath: 'src/components',
          treeOrigin: 'src',
        },
      ],
      [
        'src/components/button.tsx',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/components/button.tsx',
          realPath: 'src/components/button.tsx',
          treeOrigin: 'src',
        },
      ],
      [
        'src/main.ts',
        {
          isSymlink: false,
          kind: 'file',
          path: 'src/main.ts',
          realPath: 'src/main.ts',
          treeOrigin: 'src',
        },
      ],
    ]);

    const childrenMap = new Map<string, string[]>([
      ['src', ['src/components', 'src/main.ts']],
      ['src/components', ['src/components/button.tsx']],
    ]);

    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);

    expect(inventory.items).toHaveLength(4);

    const [root, components, button, main] = inventory.items;

    expect(root?.path).toBe('src');
    expect(root?.depth).toBe(0);
    expect(root?.parentId).toBeNull();
    expect(root?.preorderStart).toBe(0);
    expect(root?.preorderEnd).toBe(3);

    expect(components?.path).toBe('src/components');
    expect(components?.depth).toBe(1);
    expect(components?.parentId).toBe(0);
    expect(components?.preorderStart).toBe(1);
    expect(components?.preorderEnd).toBe(2);

    expect(button?.path).toBe('src/components/button.tsx');
    expect(button?.depth).toBe(2);
    expect(button?.parentId).toBe(1);
    expect(button?.preorderStart).toBe(2);
    expect(button?.preorderEnd).toBe(2);

    expect(main?.path).toBe('src/main.ts');
    expect(main?.depth).toBe(1);
    expect(main?.parentId).toBe(0);
    expect(main?.preorderStart).toBe(3);
    expect(main?.preorderEnd).toBe(3);
  });

  it('skips missing path references in entryMap without error', () => {
    const entryMap = new Map<string, TInProgressInventoryEntry>();
    const childrenMap = new Map<string, string[]>();
    const inventory = traverseInventoryTree(
      entryMap,
      ['missing-root'],
      childrenMap
    );

    expect(inventory.items).toEqual([]);
  });

  it('prefers non-symlink item for realPathToId mapping when symlink points to real item', () => {
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
      ['src', ['src/target.ts', 'src/link.ts']],
    ]);

    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);
    expect(inventory.realPathToId.get('src/target.ts')).toBe(
      inventory.pathToId.get('src/target.ts')
    );
  });

  it('maps realPath for a standalone symlink when no regular item shares that realPath', () => {
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
        'src/external-link.ts',
        {
          isSymlink: true,
          kind: 'file',
          path: 'src/external-link.ts',
          realPath: '/outside/shared.ts',
          treeOrigin: 'src',
        },
      ],
    ]);

    const childrenMap = new Map<string, string[]>([
      ['src', ['src/external-link.ts']],
    ]);

    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);
    expect(inventory.realPathToId.get('/outside/shared.ts')).toBe(
      inventory.pathToId.get('src/external-link.ts')
    );
  });

  it('does not overwrite existing realPathToId mapping when visited later by a symlink', () => {
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
        'src/second-link.ts',
        {
          isSymlink: true,
          kind: 'file',
          path: 'src/second-link.ts',
          realPath: '/outside/same.ts',
          treeOrigin: 'src',
        },
      ],
    ]);

    const childrenMap = new Map<string, string[]>([
      ['src', ['src/first-link.ts', 'src/second-link.ts']],
    ]);

    const inventory = traverseInventoryTree(entryMap, ['src'], childrenMap);
    expect(inventory.realPathToId.get('/outside/same.ts')).toBe(
      inventory.pathToId.get('src/first-link.ts')
    );
  });
});
