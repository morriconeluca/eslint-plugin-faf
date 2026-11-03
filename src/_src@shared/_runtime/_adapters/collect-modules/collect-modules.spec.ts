import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TImportResolution } from '../../../_graph/_types/dependency-graph.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../_inventory/_types/inventory.type.js';
import type {
  TModuleImport,
  TModuleRecord,
} from '../../../_syntax/_types/module-record.type.js';

import { collectModules } from './index.js';

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

const scriptRecord = (
  imports: readonly TModuleImport[] = []
): TModuleRecord => ({
  exports: [],
  imports,
  language: 'script',
  symbols: [],
  unsupportedSyntaxes: [],
});

const localResolution = (
  sourcePath: string,
  targetPath: string
): TImportResolution => ({
  aliasAlternatives: [],
  aliasUsed: null,
  importIndex: 0,
  sourcePath,
  target: { path: targetPath, type: 'local-file' },
});

describe('collectModules', () => {
  it('visits each external cycle participant once regardless of inventory order', async () => {
    const fixture = await createFixture({
      'outside/a.ts': 'export const a = 1;\n',
      'outside/b.ts': 'export const b = 1;\n',
      'src/a.ts': 'export const a = 1;\n',
      'src/z.ts': 'export const z = 1;\n',
    });
    try {
      const imports = new Map<string, readonly TModuleImport[]>([
        [
          'outside/a.ts',
          [
            {
              isTypeOnly: false,
              kind: 'named-import',
              position: { column: 1, line: 1 },
              specifier: './b.ts',
            },
          ],
        ],
        [
          'outside/b.ts',
          [
            {
              isTypeOnly: false,
              kind: 'named-import',
              position: { column: 1, line: 1 },
              specifier: './a.ts',
            },
          ],
        ],
        [
          'src/a.ts',
          [
            {
              isTypeOnly: false,
              kind: 'named-import',
              position: { column: 1, line: 1 },
              specifier: '../outside/a.ts',
            },
          ],
        ],
      ]);
      const targets = new Map([
        ['outside/a.ts', 'outside/b.ts'],
        ['outside/b.ts', 'outside/a.ts'],
        ['src/a.ts', 'outside/a.ts'],
      ]);
      const run = (paths: readonly string[]) =>
        collectModules({
          baseDirectory: fixture.path,
          inventory: inventoryOf(paths),
          producer: (path) => scriptRecord(imports.get(path) ?? []),
          resolver: (sourcePath) => {
            const targetPath = targets.get(sourcePath);
            return targetPath === undefined
              ? []
              : [localResolution(sourcePath, targetPath)];
          },
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
    } finally {
      await fixture.rm();
    }
  });

  it('does not explore an external library and does not keep an unreadable external file', async () => {
    const fixture = await createFixture({
      'node_modules/left-pad/secret.js': 'export const secret = 1;\n',
      'outside/helper.ts': 'export const helper = 1;\n',
      'src/app.ts': 'export const app = 1;\n',
    });
    const helperPath = nodePath.join(fixture.path, 'outside/helper.ts');
    nodeFs.chmodSync(helperPath, 0);
    try {
      const collection = collectModules({
        baseDirectory: fixture.path,
        inventory: inventoryOf(['src/app.ts']),
        producer: () =>
          scriptRecord([
            {
              isTypeOnly: false,
              kind: 'named-import',
              position: { column: 1, line: 1 },
              specifier: 'left-pad',
            },
            {
              isTypeOnly: false,
              kind: 'named-import',
              position: { column: 1, line: 2 },
              specifier: '../outside/helper.ts',
            },
          ]),
        resolver: () => [
          {
            aliasAlternatives: [],
            aliasUsed: null,
            importIndex: 0,
            sourcePath: 'src/app.ts',
            target: { packageName: 'left-pad', type: 'external-library' },
          },
          localResolution('src/app.ts', 'outside/helper.ts'),
        ],
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
});
