import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { includeExternalTargets } from './include-external-targets.adapter.js';

const emptyInventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

describe('includeExternalTargets', () => {
  it('adds an existing external dependency target that the tree scan omitted', async () => {
    const fixture = await createFixture({
      'package.json': '{}\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [
                { from: ['src/main.ts'], to: ['package.json'] },
              ],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('package.json')).toBe(0);
      expect(inventory.items[0]?.kind).toBe('file');
      expect(inventory.items[0]?.treeOrigin).toBeNull();
      expect(inventory.items[0]?.realPath.endsWith('package.json')).toBe(true);
      expect(nodePath.isAbsolute(inventory.items[0]?.realPath ?? '')).toBe(
        true
      );
      const again = includeExternalTargets(inventory, config, fixture.path);
      expect(again.items).toHaveLength(1);
      const missing = includeExternalTargets(
        emptyInventory,
        {
          faf: {
            locals: [
              {
                externalDependencies: [
                  { from: ['src/main.ts'], to: ['missing.json'] },
                ],
                rootLayers: ['src'],
              },
            ],
          },
        },
        fixture.path
      );
      expect(missing.items).toHaveLength(0);

      const nonexistent = includeExternalTargets(
        emptyInventory,
        {
          faf: {
            locals: [{ rootLayers: ['src'] }],
          },
        },
        '/nonexistent/directory'
      );
      expect(nonexistent.items).toHaveLength(0);
    } finally {
      await fixture.rm();
    }
  });

  it('adds external dependency directory targets as directories in inventory', async () => {
    const fixture = await createFixture({
      'legacy/client.ts': 'export const client = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          locals: [
            {
              externalDependencies: [{ from: ['src/main.ts'], to: ['legacy'] }],
              rootLayers: ['src'],
            },
          ],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('legacy')).toBe(0);
      expect(inventory.items[0]?.kind).toBe('directory');
      expect(inventory.items[0]?.treeOrigin).toBeNull();
    } finally {
      await fixture.rm();
    }
  });

  it('adds common aliases pointing to existing directories or files', async () => {
    const fixture = await createFixture({
      'src/_shared/index.ts': 'export const shared = 1;\n',
      'src/file.ts': 'export const file = 1;\n',
    });

    try {
      const config: TFAFConfig = {
        faf: {
          common: {
            aliases: {
              '#file': 'src/file.ts',
              '#missing': 'src/nonexistent',
              '#shared': 'src/_shared',
            },
          },
          locals: [{ rootLayers: ['src'] }],
        },
      };
      const inventory = includeExternalTargets(
        emptyInventory,
        config,
        fixture.path
      );
      expect(inventory.pathToId.get('src/_shared')).toBeDefined();
      expect(inventory.pathToId.get('src/file.ts')).toBeDefined();
      expect(inventory.pathToId.get('src/nonexistent')).toBeUndefined();

      const sharedItem =
        inventory.items[inventory.pathToId.get('src/_shared') ?? -1];
      expect(sharedItem?.kind).toBe('directory');
      expect(sharedItem?.treeOrigin).toBeNull();

      const fileItem =
        inventory.items[inventory.pathToId.get('src/file.ts') ?? -1];
      expect(fileItem?.kind).toBe('file');
      expect(fileItem?.treeOrigin).toBeNull();
    } finally {
      await fixture.rm();
    }
  });
});
