import { createFixture } from 'fs-fixture';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TFAFConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TInventory } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

import { includeExternalTargets } from './index.js';

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
});
