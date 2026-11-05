import { describe, expect, it } from 'vitest';

import type { TModuleRecord } from '../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { collectGraphVertices } from './index.js';

const TREE_FILE = 'src/widget.util.ts';
const EXTERNAL_FILE = 'legacy/outside.ts';
const LATER_FILE = 'src/z.ts';
const EARLIER_FILE = 'src/a.ts';

const emptyRecord = (): TModuleRecord => ({
  exports: [],
  imports: [],
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

const fileItem = (
  path: string,
  id: number,
  treeOrigin: null | string
): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: `/project/${path}`,
  treeOrigin,
});

const inventoryOf = (items: readonly TInventoryItem[]): TInventory => {
  const indexed: TInventoryItem[] = [];
  for (const item of items) {
    indexed[item.id] = item;
  }
  return {
    items: indexed,
    pathToId: new Map(items.map((item) => [item.path, item.id])),
    realPathToId: new Map(items.map((item) => [item.realPath, item.id])),
  };
};

const recordsInsertedDescending = (): Map<string, TModuleRecord> => {
  const entries: (readonly [string, TModuleRecord])[] = [];
  const ordered = [EARLIER_FILE, LATER_FILE];
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const path = ordered[index];
    if (path !== undefined) {
      entries.push([path, emptyRecord()]);
    }
  }
  return new Map(entries);
};

const localResolution = (path: string): TImportResolution => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex: 0,
  sourcePath: TREE_FILE,
  target: { path, type: 'local-file' },
});

describe('collectGraphVertices', () => {
  it('orders analyzed files and local targets independently of insertion order', () => {
    const records = recordsInsertedDescending();
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [LATER_FILE, [localResolution(EXTERNAL_FILE)]],
    ]);

    const vertices = collectGraphVertices(
      inventoryOf([]),
      records,
      resolutions
    );

    expect(vertices.paths).toEqual([EXTERNAL_FILE, EARLIER_FILE, LATER_FILE]);
    expect(vertices.pathToVertex.get(EARLIER_FILE)).toBe(1);
    expect(vertices.pathToVertex.get(LATER_FILE)).toBe(2);
  });

  it('marks a tree file with its inventory identifier', () => {
    const item = fileItem(TREE_FILE, 7, 'src');
    const records = new Map<string, TModuleRecord>([
      [TREE_FILE, emptyRecord()],
    ]);

    const vertices = collectGraphVertices(
      inventoryOf([item]),
      records,
      new Map()
    );

    expect(vertices.natures).toEqual([{ inventoryId: 7, kind: 'tree-node' }]);
  });

  it('marks inventoried files outside every tree as external local files', () => {
    const item = fileItem(EXTERNAL_FILE, 4, null);
    const records = new Map<string, TModuleRecord>([
      [EXTERNAL_FILE, emptyRecord()],
    ]);

    const vertices = collectGraphVertices(
      inventoryOf([item]),
      records,
      new Map()
    );

    expect(vertices.natures).toEqual([{ kind: 'external-local-file' }]);
  });

  it('marks a path missing from the inventory as an external local file', () => {
    const records = new Map<string, TModuleRecord>([
      [EXTERNAL_FILE, emptyRecord()],
    ]);

    const vertices = collectGraphVertices(inventoryOf([]), records, new Map());

    expect(vertices.natures).toEqual([{ kind: 'external-local-file' }]);
  });

  it('marks a path whose inventory id is absent from items as external', () => {
    const records = new Map<string, TModuleRecord>([
      [EXTERNAL_FILE, emptyRecord()],
    ]);
    const inventory: TInventory = {
      items: [],
      pathToId: new Map([[EXTERNAL_FILE, 3]]),
      realPathToId: new Map(),
    };

    const vertices = collectGraphVertices(inventory, records, new Map());

    expect(vertices.natures).toEqual([{ kind: 'external-local-file' }]);
  });

  it('keeps one vertex when a record path is also a local target', () => {
    const records = new Map<string, TModuleRecord>([
      [TREE_FILE, emptyRecord()],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [TREE_FILE, [localResolution(TREE_FILE)]],
    ]);

    const vertices = collectGraphVertices(
      inventoryOf([fileItem(TREE_FILE, 1, 'src')]),
      records,
      resolutions
    );

    expect(vertices.paths).toEqual([TREE_FILE]);
    expect(vertices.natures).toEqual([{ inventoryId: 1, kind: 'tree-node' }]);
  });

  it('does not create vertices for libraries or unresolved imports', () => {
    const records = new Map<string, TModuleRecord>([
      [TREE_FILE, emptyRecord()],
    ]);
    const resolutions = new Map<string, readonly TImportResolution[]>([
      [
        TREE_FILE,
        [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            importIndex: 0,
            sourcePath: TREE_FILE,
            target: { packageName: 'react', type: 'external-library' },
          },
          {
            aliasAlternatives: [],
            aliasUsed: null,
            importIndex: 1,
            sourcePath: TREE_FILE,
            target: { reason: 'missing', type: 'unresolved' },
          },
        ],
      ],
    ]);

    const vertices = collectGraphVertices(
      inventoryOf([fileItem(TREE_FILE, 1, 'src')]),
      records,
      resolutions
    );

    expect(vertices.paths).toEqual([TREE_FILE]);
  });
});
