import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TInventory } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { collectExternalFiles } from './index.js';

const emptyModules: TModuleCollection = {
  records: new Map(),
  resolutions: new Map(),
  unverifiedOutcomes: [],
};

const emptyInventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

describe('collectExternalFiles', () => {
  it('includes package.json even when inventory and modules are empty', () => {
    const baseDirectory = '/workspace';
    const result = collectExternalFiles({
      baseDirectory,
      inventory: emptyInventory,
      modules: emptyModules,
      treeOrigins: ['/workspace/src'],
    });

    expect(result).toEqual([nodePath.resolve('/workspace/package.json')]);
  });

  it('includes external files from inventory and module records while excluding tree files', () => {
    const baseDirectory = '/workspace';
    const treeOrigin = nodePath.resolve('/workspace/src');
    const inventory: TInventory = {
      items: [
        {
          depth: 1,
          id: 0,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'external-target.ts',
          preorderEnd: 0,
          preorderStart: 0,
          realPath: '/workspace/external-target.ts',
          treeOrigin: null,
        },
        {
          depth: 1,
          id: 1,
          isSymlink: false,
          kind: 'directory',
          parentId: null,
          path: 'external-dir',
          preorderEnd: 1,
          preorderStart: 1,
          realPath: '/workspace/external-dir',
          treeOrigin: null,
        },
        {
          depth: 2,
          id: 2,
          isSymlink: false,
          kind: 'file',
          parentId: null,
          path: 'src/main.ts',
          preorderEnd: 2,
          preorderStart: 2,
          realPath: '/workspace/src/main.ts',
          treeOrigin: 'src',
        },
      ],
      pathToId: new Map(),
      realPathToId: new Map(),
    };

    const modules: TModuleCollection = {
      records: new Map([
        [
          'external-bridge.ts',
          {
            exports: [],
            imports: [],
            language: 'binary',
            symbols: [],
            unsupportedSyntaxes: [],
          },
        ],
        [
          'src/main.ts',
          {
            exports: [],
            imports: [],
            language: 'binary',
            symbols: [],
            unsupportedSyntaxes: [],
          },
        ],
      ]),
      resolutions: new Map(),
      unverifiedOutcomes: [],
    };

    const result = collectExternalFiles({
      baseDirectory,
      inventory,
      modules,
      treeOrigins: [treeOrigin],
    });

    expect(result).toEqual([
      nodePath.resolve('/workspace/external-bridge.ts'),
      nodePath.resolve('/workspace/external-target.ts'),
      nodePath.resolve('/workspace/package.json'),
    ]);
  });
});
