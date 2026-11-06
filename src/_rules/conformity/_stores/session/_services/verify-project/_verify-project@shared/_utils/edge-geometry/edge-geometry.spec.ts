import { describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../_types/_primitives/inventory.type.js';

import { describeEdgeGeometry } from './index.js';

const createItem = (parameters: {
  depth: number;
  id: number;
  kind?: 'directory' | 'file';
  parentId: null | number;
  path: string;
  preorderEnd: number;
  preorderStart: number;
  treeOrigin?: null | string;
}): TInventoryItem => ({
  depth: parameters.depth,
  id: parameters.id,
  isSymlink: false,
  kind: parameters.kind ?? 'file',
  parentId: parameters.parentId,
  path: parameters.path,
  preorderEnd: parameters.preorderEnd,
  preorderStart: parameters.preorderStart,
  realPath: parameters.path,
  treeOrigin:
    parameters.treeOrigin === undefined ? 'src' : parameters.treeOrigin,
});

const buildInventory = (items: readonly TInventoryItem[]): TInventory => {
  const pathToId = new Map<string, number>();
  const realPathToId = new Map<string, number>();
  for (const item of items) {
    pathToId.set(item.path, item.id);
    realPathToId.set(item.realPath, item.id);
  }
  return { items, pathToId, realPathToId };
};

describe('describeEdgeGeometry', () => {
  it('describes geometry between direct siblings in the same directory', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 2,
      preorderStart: 0,
    });
    const fileA = createItem({
      depth: 1,
      id: 1,
      parentId: 0,
      path: 'src/a.ts',
      preorderEnd: 1,
      preorderStart: 1,
    });
    const fileB = createItem({
      depth: 1,
      id: 2,
      parentId: 0,
      path: 'src/b.ts',
      preorderEnd: 2,
      preorderStart: 2,
    });
    const inventory = buildInventory([root, fileA, fileB]);

    const result = describeEdgeGeometry(fileA.path, fileB.path, inventory);

    expect(result.sameTree).toBe(true);
    expect(result.differentTrees).toBe(false);
    expect(result.lowestCommonAncestor?.path).toBe('src');
    expect(result.firstStepSource?.path).toBe('src/a.ts');
    expect(result.firstStepDestination?.path).toBe('src/b.ts');
    expect(result.descendingDomains).toEqual([]);
    expect(result.isSourceInside(root)).toBe(true);
    expect(result.isSourceInside(fileB)).toBe(false);
  });

  it('describes geometry between cousins at different hierarchy depths', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 6,
      preorderStart: 0,
    });
    const directoryA = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/_a',
      preorderEnd: 3,
      preorderStart: 1,
    });
    const deepDirectory = createItem({
      depth: 2,
      id: 2,
      kind: 'directory',
      parentId: 1,
      path: 'src/_a/deep',
      preorderEnd: 3,
      preorderStart: 2,
    });
    const fileDeep = createItem({
      depth: 3,
      id: 3,
      parentId: 2,
      path: 'src/_a/deep/item.ts',
      preorderEnd: 3,
      preorderStart: 3,
    });
    const directoryB = createItem({
      depth: 1,
      id: 4,
      kind: 'directory',
      parentId: 0,
      path: 'src/_b',
      preorderEnd: 6,
      preorderStart: 4,
    });
    const otherDirectory = createItem({
      depth: 2,
      id: 5,
      kind: 'directory',
      parentId: 4,
      path: 'src/_b/other',
      preorderEnd: 6,
      preorderStart: 5,
    });
    const fileOther = createItem({
      depth: 3,
      id: 6,
      parentId: 5,
      path: 'src/_b/other/file.ts',
      preorderEnd: 6,
      preorderStart: 6,
    });
    const inventory = buildInventory([
      root,
      directoryA,
      deepDirectory,
      fileDeep,
      directoryB,
      otherDirectory,
      fileOther,
    ]);

    const result = describeEdgeGeometry(fileDeep.id, fileOther.id, inventory);

    expect(result.sameTree).toBe(true);
    expect(result.differentTrees).toBe(false);
    expect(result.lowestCommonAncestor?.path).toBe('src');
    expect(result.firstStepSource?.path).toBe('src/_a');
    expect(result.firstStepDestination?.path).toBe('src/_b');
    expect(result.descendingDomains.map((item) => item.path)).toEqual([
      'src/_b',
      'src/_b/other',
    ]);
    expect(result.isSourceInside(directoryA)).toBe(true);
    expect(result.isSourceInside(deepDirectory)).toBe(true);
    expect(result.isSourceInside(directoryB)).toBe(false);
    expect(result.isSourceInside(otherDirectory)).toBe(false);
  });

  it('describes geometry when source is an ancestor directory of destination', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
    });
    const directory = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/components',
      preorderEnd: 3,
      preorderStart: 1,
    });
    const sub = createItem({
      depth: 2,
      id: 2,
      kind: 'directory',
      parentId: 1,
      path: 'src/components/button',
      preorderEnd: 3,
      preorderStart: 2,
    });
    const file = createItem({
      depth: 3,
      id: 3,
      parentId: 2,
      path: 'src/components/button/button.ts',
      preorderEnd: 3,
      preorderStart: 3,
    });
    const inventory = buildInventory([root, directory, sub, file]);

    const result = describeEdgeGeometry(directory, file, inventory);

    expect(result.sameTree).toBe(true);
    expect(result.differentTrees).toBe(false);
    expect(result.lowestCommonAncestor?.path).toBe('src/components');
    expect(result.firstStepSource).toBeNull();
    expect(result.firstStepDestination?.path).toBe('src/components/button');
    expect(result.descendingDomains.map((item) => item.path)).toEqual([
      'src/components/button',
    ]);
    expect(result.isSourceInside(directory)).toBe(true);
    expect(result.isSourceInside(sub)).toBe(false);
  });

  it('describes geometry when destination is an ancestor directory of source', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 3,
      preorderStart: 0,
    });
    const directory = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/components',
      preorderEnd: 3,
      preorderStart: 1,
    });
    const sub = createItem({
      depth: 2,
      id: 2,
      kind: 'directory',
      parentId: 1,
      path: 'src/components/button',
      preorderEnd: 3,
      preorderStart: 2,
    });
    const file = createItem({
      depth: 3,
      id: 3,
      parentId: 2,
      path: 'src/components/button/button.ts',
      preorderEnd: 3,
      preorderStart: 3,
    });
    const inventory = buildInventory([root, directory, sub, file]);

    const result = describeEdgeGeometry(file.path, directory.path, inventory);

    expect(result.sameTree).toBe(true);
    expect(result.differentTrees).toBe(false);
    expect(result.lowestCommonAncestor?.path).toBe('src/components');
    expect(result.firstStepSource?.path).toBe('src/components/button');
    expect(result.firstStepDestination).toBeNull();
    expect(result.descendingDomains).toEqual([]);
    expect(result.isSourceInside(directory)).toBe(true);
    expect(result.isSourceInside(sub)).toBe(true);
  });

  it('describes geometry when source and destination point to the same file', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 1,
      preorderStart: 0,
    });
    const file = createItem({
      depth: 1,
      id: 1,
      parentId: 0,
      path: 'src/index.ts',
      preorderEnd: 1,
      preorderStart: 1,
    });
    const inventory = buildInventory([root, file]);

    const result = describeEdgeGeometry(file.path, file.path, inventory);

    expect(result.sameTree).toBe(true);
    expect(result.differentTrees).toBe(false);
    expect(result.lowestCommonAncestor?.path).toBe('src/index.ts');
    expect(result.firstStepSource).toBeNull();
    expect(result.firstStepDestination).toBeNull();
    expect(result.descendingDomains).toEqual([]);
  });

  it('declares cross-tree relation without calculating an ancestor', () => {
    const rootA = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 1,
      preorderStart: 0,
      treeOrigin: 'src',
    });
    const fileA = createItem({
      depth: 1,
      id: 1,
      parentId: 0,
      path: 'src/index.ts',
      preorderEnd: 1,
      preorderStart: 1,
      treeOrigin: 'src',
    });
    const rootB = createItem({
      depth: 0,
      id: 2,
      kind: 'directory',
      parentId: null,
      path: 'lib',
      preorderEnd: 3,
      preorderStart: 2,
      treeOrigin: 'lib',
    });
    const fileB = createItem({
      depth: 1,
      id: 3,
      parentId: 2,
      path: 'lib/index.ts',
      preorderEnd: 3,
      preorderStart: 3,
      treeOrigin: 'lib',
    });
    const inventory = buildInventory([rootA, fileA, rootB, fileB]);

    const result = describeEdgeGeometry(fileA.path, fileB.path, inventory);

    expect(result.sameTree).toBe(false);
    expect(result.differentTrees).toBe(true);
    expect(result.lowestCommonAncestor).toBeNull();
    expect(result.firstStepSource).toBeNull();
    expect(result.firstStepDestination).toBeNull();
    expect(result.descendingDomains).toEqual([]);
    expect(result.isSourceInside(rootA)).toBe(false);
    expect(result.isSourceInside(rootB)).toBe(false);
  });

  it('declares cross-tree relation when an item is outside trees or missing', () => {
    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 1,
      preorderStart: 0,
      treeOrigin: 'src',
    });
    const file = createItem({
      depth: 1,
      id: 1,
      parentId: 0,
      path: 'src/index.ts',
      preorderEnd: 1,
      preorderStart: 1,
      treeOrigin: 'src',
    });
    const outside = createItem({
      depth: 0,
      id: 2,
      parentId: null,
      path: 'package.json',
      preorderEnd: 2,
      preorderStart: 2,
      treeOrigin: null,
    });
    const inventory = buildInventory([root, file, outside]);

    const resultOutside = describeEdgeGeometry(
      file.path,
      outside.path,
      inventory
    );
    expect(resultOutside.differentTrees).toBe(true);
    expect(resultOutside.sameTree).toBe(false);

    const resultMissing = describeEdgeGeometry(
      file.path,
      'unknown.ts',
      inventory
    );
    expect(resultMissing.differentTrees).toBe(true);
    expect(resultMissing.sameTree).toBe(false);

    const disjointA = createItem({
      depth: 0,
      id: 3,
      kind: 'directory',
      parentId: null,
      path: 'srcA',
      preorderEnd: 3,
      preorderStart: 3,
      treeOrigin: 'src',
    });
    const disjointB = createItem({
      depth: 0,
      id: 4,
      kind: 'directory',
      parentId: null,
      path: 'srcB',
      preorderEnd: 4,
      preorderStart: 4,
      treeOrigin: 'src',
    });
    const disjointInventory = buildInventory([disjointA, disjointB]);
    const resultDisjoint = describeEdgeGeometry(
      disjointA.path,
      disjointB.path,
      disjointInventory
    );
    expect(resultDisjoint.differentTrees).toBe(true);
    expect(resultDisjoint.sameTree).toBe(false);
  });

  it('correctly models all structural edges of Compound Component table (FAF §6.6.3.4)', () => {
    const table = createItem({
      depth: 1,
      id: 1,
      kind: 'directory',
      parentId: 0,
      path: 'src/table',
      preorderEnd: 17,
      preorderStart: 1,
    });
    const tableIndex = createItem({
      depth: 2,
      id: 2,
      parentId: 1,
      path: 'src/table/index.ts',
      preorderEnd: 2,
      preorderStart: 2,
    });
    const tableComponent = createItem({
      depth: 2,
      id: 3,
      parentId: 1,
      path: 'src/table/table.component.tsx',
      preorderEnd: 3,
      preorderStart: 3,
    });
    const componentsCat = createItem({
      depth: 2,
      id: 4,
      kind: 'directory',
      parentId: 1,
      path: 'src/table/_components',
      preorderEnd: 9,
      preorderStart: 4,
    });
    const componentsShared = createItem({
      depth: 3,
      id: 5,
      kind: 'directory',
      parentId: 4,
      path: 'src/table/_components/_components@shared',
      preorderEnd: 7,
      preorderStart: 5,
    });
    const hooksCat = createItem({
      depth: 4,
      id: 6,
      kind: 'directory',
      parentId: 5,
      path: 'src/table/_components/_components@shared/_hooks',
      preorderEnd: 7,
      preorderStart: 6,
    });
    const useTableContext = createItem({
      depth: 5,
      id: 7,
      kind: 'directory',
      parentId: 6,
      path: 'src/table/_components/_components@shared/_hooks/use-table-context',
      preorderEnd: 7,
      preorderStart: 7,
    });
    const tableBody = createItem({
      depth: 3,
      id: 8,
      kind: 'directory',
      parentId: 4,
      path: 'src/table/_components/table-body',
      preorderEnd: 9,
      preorderStart: 8,
    });
    const tableBodyComponent = createItem({
      depth: 4,
      id: 9,
      parentId: 8,
      path: 'src/table/_components/table-body/table-body.component.tsx',
      preorderEnd: 9,
      preorderStart: 9,
    });
    const tableShared = createItem({
      depth: 2,
      id: 10,
      kind: 'directory',
      parentId: 1,
      path: 'src/table/_table@shared',
      preorderEnd: 13,
      preorderStart: 10,
    });
    const contextsCat = createItem({
      depth: 3,
      id: 11,
      kind: 'directory',
      parentId: 10,
      path: 'src/table/_table@shared/_contexts',
      preorderEnd: 12,
      preorderStart: 11,
    });
    const tableContext = createItem({
      depth: 4,
      id: 12,
      kind: 'directory',
      parentId: 11,
      path: 'src/table/_table@shared/_contexts/table-context',
      preorderEnd: 12,
      preorderStart: 12,
    });
    const typesCat = createItem({
      depth: 3,
      id: 13,
      kind: 'directory',
      parentId: 10,
      path: 'src/table/_table@shared/_types',
      preorderEnd: 13,
      preorderStart: 13,
    });
    const utilsCat = createItem({
      depth: 2,
      id: 14,
      kind: 'directory',
      parentId: 1,
      path: 'src/table/_utils',
      preorderEnd: 17,
      preorderStart: 14,
    });
    const sortRows = createItem({
      depth: 3,
      id: 15,
      kind: 'directory',
      parentId: 14,
      path: 'src/table/_utils/sort-table-rows',
      preorderEnd: 17,
      preorderStart: 15,
    });
    const sortRowsUtil = createItem({
      depth: 4,
      id: 16,
      parentId: 15,
      path: 'src/table/_utils/sort-table-rows/sort-table-rows.util.ts',
      preorderEnd: 16,
      preorderStart: 16,
    });

    const root = createItem({
      depth: 0,
      id: 0,
      kind: 'directory',
      parentId: null,
      path: 'src',
      preorderEnd: 17,
      preorderStart: 0,
    });

    const inventory = buildInventory([
      root,
      table,
      tableIndex,
      tableComponent,
      componentsCat,
      componentsShared,
      hooksCat,
      useTableContext,
      tableBody,
      tableBodyComponent,
      tableShared,
      contextsCat,
      tableContext,
      typesCat,
      utilsCat,
      sortRows,
      sortRowsUtil,
    ]);

    const masterToSubBody = describeEdgeGeometry(
      tableComponent,
      tableBodyComponent,
      inventory
    );
    expect(masterToSubBody.lowestCommonAncestor?.path).toBe('src/table');
    expect(masterToSubBody.firstStepSource?.path).toBe(
      'src/table/table.component.tsx'
    );
    expect(masterToSubBody.firstStepDestination?.path).toBe(
      'src/table/_components'
    );
    expect(masterToSubBody.descendingDomains.map((item) => item.path)).toEqual([
      'src/table/_components',
      'src/table/_components/table-body',
    ]);
    expect(masterToSubBody.isSourceInside(table)).toBe(true);
    expect(masterToSubBody.isSourceInside(tableBody)).toBe(false);

    const subBodyToNestedHook = describeEdgeGeometry(
      tableBodyComponent,
      useTableContext,
      inventory
    );
    expect(subBodyToNestedHook.lowestCommonAncestor?.path).toBe(
      'src/table/_components'
    );
    expect(subBodyToNestedHook.firstStepSource?.path).toBe(
      'src/table/_components/table-body'
    );
    expect(subBodyToNestedHook.firstStepDestination?.path).toBe(
      'src/table/_components/_components@shared'
    );
    expect(
      subBodyToNestedHook.descendingDomains.map((item) => item.path)
    ).toEqual([
      'src/table/_components/_components@shared',
      'src/table/_components/_components@shared/_hooks',
      'src/table/_components/_components@shared/_hooks/use-table-context',
    ]);

    const utilToContext = describeEdgeGeometry(
      sortRowsUtil,
      tableContext,
      inventory
    );
    expect(utilToContext.lowestCommonAncestor?.path).toBe('src/table');
    expect(utilToContext.firstStepSource?.path).toBe('src/table/_utils');
    expect(utilToContext.firstStepDestination?.path).toBe(
      'src/table/_table@shared'
    );
    expect(utilToContext.descendingDomains.map((item) => item.path)).toEqual([
      'src/table/_table@shared',
      'src/table/_table@shared/_contexts',
      'src/table/_table@shared/_contexts/table-context',
    ]);
  });
});
