import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { describe, expect, it } from 'vitest';

import type { TModuleRecordProducer } from './_session@shared/_types/module-record.type.js';

import { moduleRecordStore } from './_session@shared/_stores/module-record-store/index.js';
import { session } from './session.store.js';

const configSource = `export default { faf: { locals: [{ roles: [{ name: "util", category: "_utils" }], rootLayers: ["src"] }] } };`;

const conformingTree = {
  'faf.config.ts': configSource,
  'package.json': JSON.stringify({ type: 'module' }),
  'src/_utils/widget/index.ts': "export { widget } from './widget.util.js';\n",
  'src/_utils/widget/widget.util.ts': 'export const widget = 1;\n',
};

const cachePathOf = (directory: string): string =>
  nodePath.join(
    directory,
    'node_modules/.cache/eslint-plugin-faf/records.cache'
  );

const countCacheWrites = async (
  directory: string,
  action: () => Promise<void> | void
): Promise<number> => {
  const cachePath = cachePathOf(directory);
  const originalRename = nodeFs.renameSync;
  let writes = 0;
  nodeFs.renameSync = (from, to) => {
    if (to === cachePath) {
      writes += 1;
    }
    originalRename(from, to);
  };
  try {
    await action();
  } finally {
    nodeFs.renameSync = originalRename;
  }
  return writes;
};

const countProductions = (
  action: () => void
): { readonly productions: number } => {
  const original = moduleRecordStore.wrapProducer;
  let productions = 0;
  const countingProducer = (
    producer: TModuleRecordProducer,
    options: Parameters<typeof moduleRecordStore.wrapProducer>[1]
  ): TModuleRecordProducer =>
    original((path, text) => {
      productions += 1;
      return producer(path, text);
    }, options);
  Reflect.set(moduleRecordStore, 'wrapProducer', countingProducer);
  try {
    action();
  } finally {
    Reflect.set(moduleRecordStore, 'wrapProducer', original);
  }
  return { productions };
};

describe('session', () => {
  it('clears the module record cache owned by the session', () => {
    const producer = moduleRecordStore.wrapProducer(() => ({
      exports: [],
      imports: [],
      language: 'binary',
      symbols: [],
      unsupportedSyntaxes: [],
    }));
    producer('src/a.ts', 'text');
    expect(moduleRecordStore.getAllEntries().size).toBe(1);
    session.clearModuleRecords();
    expect(moduleRecordStore.getAllEntries().size).toBe(0);
  });

  it('reuses a memo and invalidates it when the linted text changes', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };
      const first = session.outcomesFor(query);
      const secondWrites = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual(first);
      });
      expect(secondWrites).toBe(0);
      expect(nodeFs.existsSync(cachePathOf(fixture.path))).toBe(true);
      const changed = session.outcomesFor({
        ...query,
        sourceText:
          "import { missing } from './missing.js';\nexport { widget } from './widget.util.js';\n",
      });
      expect(
        changed.some(
          (item) => item.outcome.constraint === 'unverified/unresolved-import'
        )
      ).toBe(true);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });

  it('verifies a conforming project once for every linted file', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const files = [
        'faf.config.ts',
        'src/_utils/widget/index.ts',
        'src/_utils/widget/widget.util.ts',
      ];
      const writes = await countCacheWrites(fixture.path, () => {
        for (const file of files) {
          const filename = nodePath.join(fixture.path, file);
          const outcomes = session.outcomesFor({
            configPath,
            filename,
            packageVersion: '0.5.0',
            sourceText: nodeFs.readFileSync(filename, 'utf8'),
            workingDirectory: fixture.path,
          });
          expect(outcomes).toEqual([]);
        }
      });
      expect(writes).toBe(1);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });

  it('invalidates the memo when faf.config.ts or a loaded file changes', async () => {
    const fixture = await createFixture({
      ...conformingTree,
      'faf.config.ts': `import './shared.js';\n${configSource}`,
      'shared.js': 'export const shared = 1;\n',
    });

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };
      expect(session.outcomesFor(query)).toEqual([]);
      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'shared.js'),
        'export const shared = 2;\n'
      );
      const afterImport = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(afterImport).toBe(1);
      nodeFs.writeFileSync(
        configPath,
        `${configSource.slice(0, -3)}, extra: true };`
      );
      const changed = session.outcomesFor({
        ...query,
        filename: configPath,
        sourceText: nodeFs.readFileSync(configPath, 'utf8'),
      });
      expect(
        changed.some(
          (item) => item.outcome.constraint === 'configuration/unknown-property'
        )
      ).toBe(true);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });

  it('drops the memo when the session clears and reloads module records from disk', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };
      session.outcomesFor(query);
      session.clearModuleRecords();
      const writes = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(writes).toBe(1);
      session.clearModuleRecords();
      const reloaded = countProductions(() => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(reloaded.productions).toBe(0);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });

  it('clears in-memory module records before verifying another configuration', async () => {
    const first = await createFixture(conformingTree);
    const second = await createFixture(conformingTree);

    try {
      const queryFor = (directory: string) => ({
        configPath: nodePath.join(directory, 'faf.config.ts'),
        filename: nodePath.join(directory, 'src/_utils/widget/index.ts'),
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: directory,
      });
      session.outcomesFor(queryFor(first.path));
      const next = countProductions(() => {
        expect(session.outcomesFor(queryFor(second.path))).toEqual([]);
      });
      expect(next.productions).toBeGreaterThan(0);
    } finally {
      session.clearModuleRecords();
      await first.rm();
      await second.rm();
    }
  });

  it('invalidates the memo when a tree file is added, modified, or removed', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };

      expect(session.outcomesFor(query)).toEqual([]);

      const extraFile = nodePath.join(
        fixture.path,
        'src/_utils/widget/extra.ts'
      );
      nodeFs.writeFileSync(extraFile, 'export const extra = 1;\n');

      const afterAdd = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(afterAdd).toBe(1);

      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'src/_utils/widget/widget.util.ts'),
        'export const widget = 2;\n'
      );

      const afterModify = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(afterModify).toBe(1);

      nodeFs.rmSync(extraFile);
      const afterRemove = await countCacheWrites(fixture.path, () => {
        expect(session.outcomesFor(query)).toEqual([]);
      });
      expect(afterRemove).toBe(1);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });

  it('invalidates the memo when package.json is modified and reuses unchanged module records', async () => {
    const fixture = await createFixture(conformingTree);

    try {
      const configPath = nodePath.join(fixture.path, 'faf.config.ts');
      const filename = nodePath.join(
        fixture.path,
        'src/_utils/widget/index.ts'
      );
      const query = {
        configPath,
        filename,
        packageVersion: '0.5.0',
        sourceText: "export { widget } from './widget.util.js';\n",
        workingDirectory: fixture.path,
      };

      expect(session.outcomesFor(query)).toEqual([]);

      nodeFs.writeFileSync(
        nodePath.join(fixture.path, 'package.json'),
        JSON.stringify({ description: 'updated', type: 'module' })
      );
      nodeFs.rmSync(cachePathOf(fixture.path));

      let reloadedProductions = 0;
      const writes = await countCacheWrites(fixture.path, () => {
        const result = countProductions(() => {
          expect(session.outcomesFor(query)).toEqual([]);
        });
        reloadedProductions = result.productions;
      });

      expect(writes).toBe(1);
      expect(reloadedProductions).toBe(0);
    } finally {
      session.clearModuleRecords();
      await fixture.rm();
    }
  });
});
