import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TInventory } from '../../../../../_inventory/_types/inventory.type.js';

import { analyzeQueuedModule } from './index.js';

const inventory: TInventory = {
  items: [],
  pathToId: new Map(),
  realPathToId: new Map(),
};

describe('analyzeQueuedModule', () => {
  it('uses the text override and does not read the disk', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const fromDisk = 1;\n',
    });
    const absolute = nodePath.join(fixture.path, 'src/app.ts');
    nodeFs.chmodSync(absolute, 0);
    try {
      const seen: string[] = [];
      const analysis = analyzeQueuedModule({
        baseDirectory: fixture.path,
        inventory,
        producer: (_path, text) => {
          seen.push(text);
          return {
            exports: [],
            imports: [],
            language: 'script',
            symbols: [],
            unsupportedSyntaxes: [],
          };
        },
        relativePath: 'src/app.ts',
        resolver: () => [],
        textOverrides: new Map([
          ['src/app.ts', 'export const fromOverride = 1;\n'],
        ]),
      });
      expect(seen).toEqual(['export const fromOverride = 1;\n']);
      expect(analysis.record?.language).toBe('script');
      expect(analysis.outcomes).toEqual([]);
    } finally {
      nodeFs.chmodSync(absolute, 0o700);
      await fixture.rm();
    }
  });

  it('reads the disk when no override is present', async () => {
    const fixture = await createFixture({
      'src/app.ts': 'export const fromDisk = 1;\n',
    });
    try {
      const analysis = analyzeQueuedModule({
        baseDirectory: fixture.path,
        inventory,
        producer: (_path, text) => ({
          exports: [],
          imports: [],
          language: text.includes('fromDisk') ? 'script' : 'binary',
          symbols: [],
          unsupportedSyntaxes: [],
        }),
        relativePath: 'src/app.ts',
        resolver: () => [],
        textOverrides: new Map(),
      });
      expect(analysis.record?.language).toBe('script');
    } finally {
      await fixture.rm();
    }
  });
});
