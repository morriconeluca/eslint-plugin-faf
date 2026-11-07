import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import type {
  TInventory,
  TInventoryItem,
} from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { moduleRecordStore } from '../../../../_session@shared/_stores/module-record-store/index.js';
import { collectModules } from './collect-modules.adapter.js';

const fileItem = (id: number, path: string): TInventoryItem => ({
  depth: 1,
  id,
  isSymlink: false,
  kind: 'file',
  parentId: null,
  path,
  preorderEnd: id,
  preorderStart: id,
  realPath: path,
  treeOrigin: 'src',
});

const inventoryOf = (paths: readonly string[]): TInventory => ({
  items: paths.map((path, id) => fileItem(id, path)),
  pathToId: new Map(paths.map((path, id) => [path, id])),
  realPathToId: new Map(paths.map((path, id) => [path, id])),
});

describe('collectModules', () => {
  beforeEach(() => {
    moduleRecordStore.clear();
  });

  it('visits each external cycle participant once regardless of inventory order', async () => {
    const fixture = await createFixture({
      'outside/a.ts': 'export { b } from "./b.ts";\nexport const a = 1;\n',
      'outside/b.ts': 'export { a } from "./a.ts";\nexport const b = 1;\n',
      'src/a.ts': 'export { a } from "../outside/a.ts";\n',
      'src/z.ts': 'export const z = 1;\n',
    });
    try {
      const run = (paths: readonly string[]) =>
        collectModules({
          aliases: [],
          baseDirectory: fixture.path,
          inventory: inventoryOf(paths),
          textOverrides: new Map(),
        });
      const forward = run(['src/z.ts', 'src/a.ts']);
      const reversed = run(['src/a.ts', 'src/z.ts']);
      expect(forward.records.has('outside/a.ts')).toBe(true);
      expect(forward.records.has('outside/b.ts')).toBe(true);
      expect(forward.records.has('src/a.ts')).toBe(true);
      expect(forward.records.has('src/z.ts')).toBe(true);
      expect(reversed.records.has('outside/a.ts')).toBe(true);
      expect(reversed.records.has('src/z.ts')).toBe(true);
      expect(forward.records.has('outside/a.ts')).toBe(true);
      expect(forward.records.has('outside/b.ts')).toBe(true);
      expect(forward.unverifiedOutcomes).toEqual([]);
    } finally {
      await fixture.rm();
    }
  });

  it('does not explore an external library and does not keep an unreadable external file', async () => {
    const fixture = await createFixture({
      'node_modules/left-pad/package.json':
        '{"name":"left-pad","main":"secret.js"}\n',
      'node_modules/left-pad/secret.js': 'export const secret = 1;\n',
      'outside/helper.ts': 'export const helper = 1;\n',
      'src/app.ts':
        'import "left-pad";\nimport "../outside/helper.ts";\nexport const app = 1;\n',
    });
    const helperPath = nodePath.join(fixture.path, 'outside/helper.ts');
    nodeFs.chmodSync(helperPath, 0);
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts']),
        textOverrides: new Map(),
      });
      expect(collection.records.has('node_modules/left-pad/secret.js')).toBe(
        false
      );
      expect(collection.records.has('outside/helper.ts')).toBe(false);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/helper.ts' &&
            outcome.constraint === 'unverified/unreadable-external-file'
        )
      ).toBe(true);
    } finally {
      nodeFs.chmodSync(helperPath, 0o700);
      await fixture.rm();
    }
  });

  it('keeps a tree file that nothing imports and records a reached external file', async () => {
    const fixture = await createFixture({
      'outside/helper.ts': 'export const helper = 1;\n',
      'src/app.ts':
        'import { helper } from "../outside/helper.ts";\nexport const app = helper;\n',
      'src/orphan.ts': 'export const orphan = 1;\n',
    });
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts', 'src/orphan.ts']),
        textOverrides: new Map(),
      });
      expect(collection.records.has('src/orphan.ts')).toBe(true);
      expect(collection.records.has('outside/helper.ts')).toBe(true);
      expect(collection.resolutions.get('src/app.ts')?.[0]?.target).toEqual({
        path: 'outside/helper.ts',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('explores a reached external file and does not treat unavailable dependencies as leaves', async () => {
    const fixture = await createFixture({
      'outside/locked.ts': 'export const locked = 1;\n',
      'outside/x.ts':
        'import { locked } from "./locked.ts";\nimport { missing } from "./missing.ts";\nexport const external = locked;\n',
      'src/app.ts':
        'import { external } from "../outside/x.ts";\nexport const app = external;\n',
    });
    const lockedPath = nodePath.join(fixture.path, 'outside/locked.ts');
    nodeFs.chmodSync(lockedPath, 0);
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts']),
        textOverrides: new Map(),
      });
      expect(collection.records.has('outside/x.ts')).toBe(true);
      expect(collection.records.has('outside/locked.ts')).toBe(false);
      expect(collection.records.has('outside/missing.ts')).toBe(false);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/locked.ts' &&
            outcome.constraint === 'unverified/unreadable-external-file'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'outside/x.ts' &&
            outcome.constraint === 'unverified/unresolved-import'
        )
      ).toBe(true);
    } finally {
      nodeFs.chmodSync(lockedPath, 0o700);
      await fixture.rm();
    }
  });

  it('uses the lint text override instead of disk content', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const fromDisk = 1;\n',
    });
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts']),
        textOverrides: new Map([
          ['src/app.ts', 'export const fromOverride = 1;\n'],
        ]),
      });
      const symbols = collection.records.get('src/app.ts')?.symbols ?? [];
      expect(symbols.some((symbol) => symbol.name === 'fromOverride')).toBe(
        true
      );
      expect(symbols.some((symbol) => symbol.name === 'fromDisk')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('explores a workspace package through a node_modules symlink and ignores a real library', async () => {
    const fixture = await createFixture({
      'node_modules/left-pad/index.js':
        'import { secret } from "./secret.js";\nexport const pad = secret;\n',
      'node_modules/left-pad/package.json': JSON.stringify({
        main: './index.js',
        name: 'left-pad',
        type: 'module',
      }),
      'node_modules/left-pad/secret.js': 'export const secret = 1;\n',
      'package.json': JSON.stringify({ name: 'root', type: 'module' }),
      'packages/ws/dep.ts': 'export const dep = 1;\n',
      'packages/ws/index.ts':
        'import { dep } from "./dep.ts";\nexport const entry = dep;\n',
      'packages/ws/package.json': JSON.stringify({
        exports: { '.': './index.ts' },
        name: 'ws-pkg',
        type: 'module',
      }),
      'src/app.ts':
        'import { entry } from "ws-pkg";\nimport { pad } from "left-pad";\nexport const app = entry + pad;\n',
    });
    await nodeFs.promises.symlink(
      nodePath.join(fixture.path, 'packages/ws'),
      nodePath.join(fixture.path, 'node_modules/ws-pkg')
    );
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts']),
        textOverrides: new Map(),
      });
      expect(collection.records.has('packages/ws/index.ts')).toBe(true);
      expect(collection.records.has('packages/ws/dep.ts')).toBe(true);
      expect(collection.records.has('node_modules/left-pad/index.js')).toBe(
        false
      );
      expect(collection.records.has('node_modules/left-pad/secret.js')).toBe(
        false
      );
      const library = collection.resolutions
        .get('src/app.ts')
        ?.find((resolution) => resolution.target.type === 'external-library');
      expect(library?.target).toEqual({
        packageName: 'left-pad',
        type: 'external-library',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('produces a script record for a JavaScript tree file', async () => {
    const fixture = await createFixture({
      'src/legacy/helper.js': 'export const helper = 1;\n',
      'src/legacy/widget.js':
        'import { helper } from "./helper.js";\nexport const widget = helper;\n',
    });
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf([
          'src/legacy/helper.js',
          'src/legacy/widget.js',
        ]),
        textOverrides: new Map(),
      });
      expect(collection.records.get('src/legacy/widget.js')?.language).toBe(
        'script'
      );
      expect(
        collection.resolutions.get('src/legacy/widget.js')?.[0]?.target
      ).toEqual({
        path: 'src/legacy/helper.js',
        type: 'local-file',
      });
    } finally {
      await fixture.rm();
    }
  });

  it('reports a deleted tree file, a directory standing in for a file, and undecodable text', async () => {
    const fixture = await createFixture({
      'src/broken.ts': Buffer.from([255, 254]),
      'src/folder.ts/nested.ts': 'export const nested = 1;\n',
      'src/kept.ts': 'export const kept = 1;\n',
    });
    try {
      const inventory = inventoryOf(['src/broken.ts', 'src/kept.ts']);
      const deleted = fileItem(inventory.items.length, 'src/deleted.ts');
      const directory = fileItem(inventory.items.length + 1, 'src/folder.ts');
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: {
          items: [...inventory.items, deleted, directory],
          pathToId: new Map([
            ...inventory.pathToId,
            [deleted.path, deleted.id],
            [directory.path, directory.id],
          ]),
          realPathToId: new Map([
            ...inventory.realPathToId,
            [deleted.realPath, deleted.id],
            [directory.realPath, directory.id],
          ]),
        },
        textOverrides: new Map(),
      });
      expect(collection.records.has('src/deleted.ts')).toBe(false);
      expect(collection.records.has('src/folder.ts')).toBe(false);
      expect(collection.records.has('src/broken.ts')).toBe(false);
      expect(collection.records.has('src/kept.ts')).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/deleted.ts' &&
            outcome.reason === 'File is missing' &&
            outcome.constraint === 'unverified/unreadable-entry'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/folder.ts' &&
            outcome.reason === 'Path is a directory' &&
            outcome.constraint === 'unverified/unreadable-entry'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/broken.ts' &&
            outcome.constraint === 'unverified/unreadable-entry' &&
            outcome.reason.includes('Text is not valid UTF-8')
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('queues external entry files present in the inventory', async () => {
    const fixture = await createFixture({
      'consumer.ts': 'export const c = 1;\n',
    });
    try {
      const inventory: TInventory = {
        items: [
          {
            depth: 0,
            id: 0,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'consumer.ts',
            preorderEnd: 0,
            preorderStart: 0,
            realPath: nodePath.join(fixture.path, 'consumer.ts'),
            treeOrigin: null,
          },
        ],
        pathToId: new Map([['consumer.ts', 0]]),
        realPathToId: new Map(),
      };
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory,
        textOverrides: new Map(),
      });
      expect(collection.records.has('consumer.ts')).toBe(true);
    } finally {
      await fixture.rm();
    }
  });

  it('skips external directories and duplicate external files from queueing', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const app = 1;\n',
    });
    try {
      const inventory: TInventory = {
        items: [
          {
            depth: 0,
            id: 0,
            isSymlink: false,
            kind: 'directory',
            parentId: null,
            path: 'outside-dir',
            preorderEnd: 0,
            preorderStart: 0,
            realPath: nodePath.join(fixture.path, 'outside-dir'),
            treeOrigin: null,
          },
          {
            depth: 0,
            id: 1,
            isSymlink: false,
            kind: 'file',
            parentId: null,
            path: 'src/app.ts',
            preorderEnd: 1,
            preorderStart: 1,
            realPath: nodePath.join(fixture.path, 'src/app.ts'),
            treeOrigin: null,
          },
        ],
        pathToId: new Map([
          ['outside-dir', 0],
          ['src/app.ts', 1],
        ]),
        realPathToId: new Map(),
      };
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory,
        textOverrides: new Map(),
      });
      expect(collection.records.has('outside-dir')).toBe(false);
    } finally {
      await fixture.rm();
    }
  });

  it('emits non-literal dynamic import and unsupported syntax outcomes', async () => {
    const fixture = await createFixture({
      'src/dynamic.ts':
        'export const load = (name: string): Promise<unknown> => import(name);\n',
      'src/legacy.ts': 'export = 1;\n',
    });
    try {
      const collection = collectModules({
        aliases: [],
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/dynamic.ts', 'src/legacy.ts']),
        textOverrides: new Map(),
      });
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/dynamic.ts' &&
            outcome.constraint === 'unverified/non-literal-dynamic-import'
        )
      ).toBe(true);
      expect(
        collection.unverifiedOutcomes.some(
          (outcome) =>
            outcome.element === 'src/legacy.ts' &&
            outcome.constraint === 'unverified/unsupported-syntax'
        )
      ).toBe(true);
    } finally {
      await fixture.rm();
    }
  });
});
