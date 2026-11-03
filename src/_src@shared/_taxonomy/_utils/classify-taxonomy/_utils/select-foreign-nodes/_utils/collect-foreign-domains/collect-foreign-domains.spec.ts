import { describe, expect, it } from 'vitest';

import type { TRawInventoryEntry } from '../../../../../../../_inventory/_types/inventory.type.js';

import { buildInventory } from '../../../../../../../_inventory/_utils/build-inventory/index.js';
import { collectForeignDomains } from './collect-foreign-domains.util.js';

const createRawEntry = (
  path: string,
  kind: 'directory' | 'file'
): TRawInventoryEntry => ({
  isSymlink: false,
  kind,
  path,
  realPath: path,
});

describe('collectForeignDomains', () => {
  it('collects foreign domain directory and recursive descendant files and subdirectories', () => {
    const raw: TRawInventoryEntry[] = [
      createRawEntry('src', 'directory'),
      createRawEntry('src/_tooling', 'directory'),
      createRawEntry('src/_tooling/nested', 'directory'),
      createRawEntry('src/_tooling/tool.ts', 'file'),
      createRawEntry('src/_tooling/nested/config.json', 'file'),
      createRawEntry('src/main.ts', 'file'),
    ];

    const buildResult = buildInventory(raw, ['src']);
    const inventory = buildResult.inventory;
    const originId = inventory.pathToId.get('src') ?? 0;
    const originItem = inventory.items[originId];
    if (originItem === undefined) {
      expect(originItem).toBeDefined();
      return;
    }

    const result = collectForeignDomains(
      inventory,
      inventory.items,
      originItem,
      ['src/_tooling']
    );

    expect(result.domainPaths.has('src/_tooling')).toBe(true);
    expect(result.domainPaths.has('src/_tooling/nested')).toBe(true);
    expect(result.nodePaths.has('src/_tooling/tool.ts')).toBe(true);
    expect(result.nodePaths.has('src/_tooling/nested/config.json')).toBe(true);
    expect(result.nodePaths.has('src/main.ts')).toBe(false);
  });

  it('ignores nonexistent paths or paths that resolve to files or outside origin', () => {
    const raw: TRawInventoryEntry[] = [
      createRawEntry('src', 'directory'),
      createRawEntry('src/file.ts', 'file'),
      createRawEntry('other', 'directory'),
    ];

    const buildResult = buildInventory(raw, ['src', 'other']);
    const inventory = buildResult.inventory;
    const originId = inventory.pathToId.get('src') ?? 0;
    const originItem = inventory.items[originId];
    if (originItem === undefined) {
      expect(originItem).toBeDefined();
      return;
    }

    const result = collectForeignDomains(
      inventory,
      inventory.items,
      originItem,
      ['nonexistent', 'src/file.ts', 'other']
    );

    expect(result.domainItemIds.size).toBe(0);
    expect(result.nodeItemIds.size).toBe(0);
  });
});
