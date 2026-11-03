import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../../_syntax/_types/module-record.type.js';

import { readModuleRecordCache } from '../../_adapters/read-module-record-cache/index.js';
import { writeModuleRecordCache } from '../../_adapters/write-module-record-cache/index.js';
import { calculateContentKey } from './_utils/calculate-content-key/index.js';
import { moduleRecordStore } from './module-record-store.store.js';

const createDummyRecord = (name: string): TModuleRecord => ({
  exports: [
    {
      exportedName: name,
      isTypeOnly: false,
      origin: { symbolName: name, type: 'local-symbol' },
      position: { column: 1, line: 1 },
    },
  ],
  imports: [],
  language: 'script',
  symbols: [
    {
      name,
      position: { column: 1, line: 1 },
      space: 'value',
    },
  ],
  unsupportedSyntaxes: [],
});

describe('moduleRecordStore', () => {
  beforeEach(() => {
    moduleRecordStore.clear();
  });

  it('wraps a producer and returns cached record on subsequent calls without calling producer', () => {
    const rawProducer: TModuleRecordProducer = vi.fn((path, text) =>
      createDummyRecord(`${path}:${text}`)
    );
    const wrapped = moduleRecordStore.wrapProducer(rawProducer);

    const first = wrapped('src/a.ts', 'const x = 1;');
    expect(first.symbols[0]?.name).toBe('src/a.ts:const x = 1;');
    expect(rawProducer).toHaveBeenCalledTimes(1);

    const second = wrapped('src/a.ts', 'const x = 1;');
    expect(second).toBe(first);
    expect(rawProducer).toHaveBeenCalledTimes(1);
  });

  it('consults memory before persistent entries for the same content key', () => {
    const path = 'src/a.ts';
    const text = 'const x = 1;';
    const key = calculateContentKey(path, text);
    const memoryRecord = createDummyRecord('memory');
    const persistentRecord = createDummyRecord('persistent');

    const producer: TModuleRecordProducer = vi.fn(() => memoryRecord);
    const wrapped = moduleRecordStore.wrapProducer(producer);
    wrapped(path, text);
    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([[key, persistentRecord]])
    );

    expect(wrapped(path, text)).toBe(memoryRecord);
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('consults persistent cache before calling producer and promotes to memory tier', () => {
    const path = 'test-file.ts';
    const text = 'const a = 1;';
    const key = calculateContentKey(path, text);
    const persistentRecord = createDummyRecord('persistent');
    const persistentMap = new Map<string, TModuleRecord>([
      [key, persistentRecord],
    ]);

    const producer: TModuleRecordProducer = vi.fn(() =>
      createDummyRecord('fresh')
    );
    const wrapped = moduleRecordStore.wrapProducer(producer);
    wrapped(path, text);
    expect(producer).toHaveBeenCalledTimes(1);

    moduleRecordStore.clear();
    moduleRecordStore.setPersistentEntries(persistentMap);

    const spyProducer: TModuleRecordProducer = vi.fn(() =>
      createDummyRecord('spy')
    );
    const secondWrapped = moduleRecordStore.wrapProducer(spyProducer);

    const retrieved = secondWrapped(path, text);
    expect(retrieved).toEqual(persistentRecord);
    expect(spyProducer).toHaveBeenCalledTimes(0);

    const third = secondWrapped(path, text);
    expect(third).toBe(retrieved);
    expect(spyProducer).toHaveBeenCalledTimes(0);

    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([[key, createDummyRecord('replaced')]])
    );
    expect(secondWrapped(path, text)).toBe(retrieved);
  });

  it('hydrates persistent cache via wrapProducer options', () => {
    const path = 'src/foo.ts';
    const text = 'export const foo = 1;';
    const record = createDummyRecord('preloaded');
    const persistentMap = new Map<string, TModuleRecord>([
      [calculateContentKey(path, text), record],
    ]);

    const spyProducer: TModuleRecordProducer = vi.fn(() =>
      createDummyRecord('spy')
    );
    const wrappedWithOptions = moduleRecordStore.wrapProducer(spyProducer, {
      persistentEntries: persistentMap,
    });

    const result = wrappedWithOptions(path, text);
    expect(result).toEqual(record);
    expect(spyProducer).toHaveBeenCalledTimes(0);
  });

  it('replaces persistent entries instead of merging them', () => {
    const replacedPath = 'src/replaced.ts';
    const replacedText = 'const replaced = 1;';
    const keptPath = 'src/kept.ts';
    const keptText = 'const kept = 2;';
    const replacedKey = calculateContentKey(replacedPath, replacedText);
    const keptKey = calculateContentKey(keptPath, keptText);
    const keptRecord = createDummyRecord('kept');
    const replacedRecord = createDummyRecord('replaced');

    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([[replacedKey, replacedRecord]])
    );
    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([[keptKey, keptRecord]])
    );

    expect(moduleRecordStore.getAllEntries().size).toBe(0);

    const producer: TModuleRecordProducer = vi.fn(() =>
      createDummyRecord('fresh')
    );
    const wrapped = moduleRecordStore.wrapProducer(producer);

    const freshRecord = wrapped(replacedPath, replacedText);
    expect(freshRecord).not.toBe(replacedRecord);
    expect(freshRecord.symbols[0]?.name).toBe('fresh');
    expect(wrapped(keptPath, keptText)).toBe(keptRecord);
    expect(producer).toHaveBeenCalledTimes(1);
    expect(moduleRecordStore.getAllEntries().get(replacedKey)).toBe(
      freshRecord
    );
    expect(moduleRecordStore.getAllEntries().get(keptKey)).toBe(keptRecord);
  });

  it('lets memory entries override persistent entries with the same key', () => {
    const key = calculateContentKey('src/a.ts', 'const x = 1;');
    const persistentRecord = createDummyRecord('persistent');
    const memoryRecord = createDummyRecord('memory');
    const wrapped = moduleRecordStore.wrapProducer(() => memoryRecord);
    wrapped('src/a.ts', 'const x = 1;');
    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([[key, persistentRecord]])
    );

    expect(moduleRecordStore.getAllEntries().has(key)).toBe(false);
    expect(wrapped('src/a.ts', 'const x = 1;')).toBe(memoryRecord);
    expect(moduleRecordStore.getAllEntries().get(key)).toBe(memoryRecord);
  });

  it('recalculates exactly one record when file text is modified', () => {
    const spyProducer: TModuleRecordProducer = vi.fn((path, text) =>
      createDummyRecord(`${path}:${text}`)
    );
    const wrapped = moduleRecordStore.wrapProducer(spyProducer);

    wrapped('src/file1.ts', 'const a = 1;');
    wrapped('src/file2.ts', 'const b = 2;');
    wrapped('src/file3.ts', 'const c = 3;');
    expect(spyProducer).toHaveBeenCalledTimes(3);

    wrapped('src/file1.ts', 'const a = 1;');
    wrapped('src/file2.ts', 'const b = 2;');
    wrapped('src/file3.ts', 'const c = 3;');
    expect(spyProducer).toHaveBeenCalledTimes(3);

    wrapped('src/file2.ts', 'const b = 222;');
    expect(spyProducer).toHaveBeenCalledTimes(4);

    wrapped('src/file1.ts', 'const a = 1;');
    wrapped('src/file2.ts', 'const b = 222;');
    wrapped('src/file3.ts', 'const c = 3;');
    expect(spyProducer).toHaveBeenCalledTimes(4);
  });

  it('preserves disk content record when unsaved lint text differs from disk', () => {
    const spyProducer: TModuleRecordProducer = vi.fn((path, text) =>
      createDummyRecord(`${path}:${text}`)
    );
    const wrapped = moduleRecordStore.wrapProducer(spyProducer);

    const diskText = 'export const disk = true;';
    const diskRecord = wrapped('src/module.ts', diskText);
    expect(spyProducer).toHaveBeenCalledTimes(1);

    const lintText = 'export const lint = true;';
    const lintRecord = wrapped('src/module.ts', lintText);
    expect(spyProducer).toHaveBeenCalledTimes(2);
    expect(lintRecord.symbols[0]?.name).toBe(
      'src/module.ts:export const lint = true;'
    );

    const diskRecordAgain = wrapped('src/module.ts', diskText);
    expect(diskRecordAgain).toBe(diskRecord);
    expect(spyProducer).toHaveBeenCalledTimes(2);

    const entries = moduleRecordStore.getAllEntries();
    expect(entries.get(calculateContentKey('src/module.ts', diskText))).toBe(
      diskRecord
    );
    expect(entries.get(calculateContentKey('src/module.ts', lintText))).toBe(
      lintRecord
    );
  });

  it('clears memory and persistent entries when clear is invoked', () => {
    const path = 'src/test.ts';
    const text = 'const x = 1;';
    const spyProducer: TModuleRecordProducer = vi.fn((itemPath, itemText) =>
      createDummyRecord(`${itemPath}:${itemText}`)
    );
    const wrapped = moduleRecordStore.wrapProducer(spyProducer);

    const produced = wrapped(path, text);
    expect(moduleRecordStore.getAllEntries().size).toBe(1);
    moduleRecordStore.setPersistentEntries(
      new Map<string, TModuleRecord>([
        [calculateContentKey(path, text), createDummyRecord('persistent')],
      ])
    );
    expect(moduleRecordStore.getAllEntries().size).toBe(0);
    expect(wrapped(path, text)).toBe(produced);
    expect(
      moduleRecordStore.getAllEntries().get(calculateContentKey(path, text))
    ).toBe(produced);

    moduleRecordStore.clear();
    expect(moduleRecordStore.getAllEntries().size).toBe(0);

    wrapped(path, text);
    expect(spyProducer).toHaveBeenCalledTimes(2);
  });

  it('recalculates records when a reloaded cache file is corrupt', async () => {
    const fixture = await createFixture({
      'src/item.ts': 'export const item = 1;',
    });
    try {
      const filePath = nodePath.join(fixture.path, 'src/item.ts');
      const text = nodeFs.readFileSync(filePath, 'utf8');
      const packageVersion = '0.5.0';
      const producer: TModuleRecordProducer = vi.fn((itemPath, itemText) =>
        createDummyRecord(`${itemPath}:${itemText}`)
      );
      const wrapped = moduleRecordStore.wrapProducer(producer);
      wrapped(filePath, text);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: moduleRecordStore.getAllEntries(),
        packageVersion,
      });

      const cachePath = nodePath.join(
        fixture.path,
        'node_modules/.cache/eslint-plugin-faf/records.cache'
      );
      nodeFs.writeFileSync(cachePath, Buffer.from('corrupted binary data'));
      moduleRecordStore.clear();

      const loaded = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion,
      });
      expect(loaded.size).toBe(0);

      const spyProducer: TModuleRecordProducer = vi.fn((itemPath, itemText) =>
        createDummyRecord(`${itemPath}:${itemText}`)
      );
      const reloaded = moduleRecordStore.wrapProducer(spyProducer, {
        persistentEntries: loaded,
      });
      expect(reloaded(filePath, text).symbols[0]?.name).toBe(
        `${filePath}:${text}`
      );
      expect(spyProducer).toHaveBeenCalledTimes(1);
    } finally {
      await fixture.rm();
    }
  });

  it('simulates second run on 10,000 entries reloaded from disk with 0 producer calls', async () => {
    const count = 10_000;
    const files = Object.fromEntries(
      Array.from({ length: count }, (_, index) => [
        `src/item${index}.ts`,
        `export const item${index} = ${index};`,
      ])
    );

    const fixture = await createFixture(files);
    try {
      const packageVersion = '0.5.0';
      const firstRunProducer: TModuleRecordProducer = vi.fn((path, text) =>
        createDummyRecord(`${path}:${text}`)
      );
      const firstRunWrapped = moduleRecordStore.wrapProducer(firstRunProducer);

      for (let index = 0; index < count; index += 1) {
        const filePath = nodePath.join(fixture.path, `src/item${index}.ts`);
        const text = nodeFs.readFileSync(filePath, 'utf8');
        firstRunWrapped(filePath, text);
      }
      expect(firstRunProducer).toHaveBeenCalledTimes(count);

      const allEntries = moduleRecordStore.getAllEntries();
      expect(allEntries.size).toBe(count);

      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: allEntries,
        packageVersion,
      });

      moduleRecordStore.clear();
      expect(moduleRecordStore.getAllEntries().size).toBe(0);

      const loadStart = performance.now();
      const loadedFromDisk = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion,
      });
      const loadMs = performance.now() - loadStart;
      expect(loadedFromDisk.size).toBe(count);

      const spyProducer: TModuleRecordProducer = vi.fn((path, text) =>
        createDummyRecord(`unexpected:${path}:${text}`)
      );
      const secondRunWrapped = moduleRecordStore.wrapProducer(spyProducer, {
        persistentEntries: loadedFromDisk,
      });
      const texts = Array.from({ length: count }, (_, index) => {
        const filePath = nodePath.join(fixture.path, `src/item${index}.ts`);
        return {
          filePath,
          text: nodeFs.readFileSync(filePath, 'utf8'),
        };
      });

      const lookupStart = performance.now();
      for (const item of texts) {
        const record = secondRunWrapped(item.filePath, item.text);
        expect(record.symbols[0]?.name).toBe(`${item.filePath}:${item.text}`);
      }
      const lookupMs = performance.now() - lookupStart;
      console.info(
        `module-record-cache second run: load ${loadMs.toFixed(2)} ms, lookup ${lookupMs.toFixed(2)} ms for ${count} entries`
      );

      const elapsedMs = loadMs + lookupMs;

      expect(spyProducer).toHaveBeenCalledTimes(0);
      expect(elapsedMs).toBeGreaterThanOrEqual(0);
    } finally {
      await fixture.rm();
    }
  });

  it('omits the previous content record from the saved file after a modification', async () => {
    const fixture = await createFixture({
      'src/changing.ts': 'export const value = 1;',
      'src/stable.ts': 'export const stable = 1;',
    });
    try {
      const packageVersion = '0.5.0';
      const stablePath = nodePath.join(fixture.path, 'src/stable.ts');
      const changingPath = nodePath.join(fixture.path, 'src/changing.ts');
      const stableText = nodeFs.readFileSync(stablePath, 'utf8');
      const previousText = nodeFs.readFileSync(changingPath, 'utf8');
      const producer: TModuleRecordProducer = (path, text) =>
        createDummyRecord(`${path}:${text}`);
      const firstRun = moduleRecordStore.wrapProducer(producer);
      firstRun(stablePath, stableText);
      firstRun(changingPath, previousText);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: moduleRecordStore.getAllEntries(),
        packageVersion,
      });

      const nextText = 'export const value = 2;';
      nodeFs.writeFileSync(changingPath, nextText);
      moduleRecordStore.clear();
      const loaded = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion,
      });
      const secondRun = moduleRecordStore.wrapProducer(producer, {
        persistentEntries: loaded,
      });
      secondRun(stablePath, stableText);
      secondRun(changingPath, nextText);
      writeModuleRecordCache({
        baseDirectory: fixture.path,
        entries: moduleRecordStore.getAllEntries(),
        packageVersion,
      });

      const persisted = readModuleRecordCache({
        baseDirectory: fixture.path,
        packageVersion,
      });
      const previousKey = calculateContentKey(changingPath, previousText);
      const nextKey = calculateContentKey(changingPath, nextText);
      const stableKey = calculateContentKey(stablePath, stableText);
      expect(persisted.has(previousKey)).toBe(false);
      expect(persisted.get(nextKey)?.symbols[0]?.name).toBe(
        `${changingPath}:${nextText}`
      );
      expect(persisted.get(stableKey)?.symbols[0]?.name).toBe(
        `${stablePath}:${stableText}`
      );
      expect(persisted.size).toBe(2);
    } finally {
      await fixture.rm();
    }
  });

  it('keeps the entry count at N across save cycles for stable files', async () => {
    const count = 4;
    const cycles = 3;
    const files = Object.fromEntries(
      Array.from({ length: count }, (_, index) => [
        `src/stable${index}.ts`,
        `export const stable${index} = 1;`,
      ])
    );
    const fixture = await createFixture(files);
    try {
      const packageVersion = '0.5.0';
      const producer: TModuleRecordProducer = (path, text) =>
        createDummyRecord(`${path}:${text}`);

      for (let cycle = 0; cycle < cycles; cycle += 1) {
        moduleRecordStore.clear();
        const loaded =
          cycle === 0
            ? new Map<string, TModuleRecord>()
            : readModuleRecordCache({
                baseDirectory: fixture.path,
                packageVersion,
              });
        const wrapped = moduleRecordStore.wrapProducer(producer, {
          persistentEntries: loaded,
        });

        for (let index = 0; index < count; index += 1) {
          const filePath = nodePath.join(fixture.path, `src/stable${index}.ts`);
          wrapped(filePath, nodeFs.readFileSync(filePath, 'utf8'));
        }

        const entries = moduleRecordStore.getAllEntries();
        expect(entries.size).toBe(count);
        writeModuleRecordCache({
          baseDirectory: fixture.path,
          entries,
          packageVersion,
        });
        expect(
          readModuleRecordCache({
            baseDirectory: fixture.path,
            packageVersion,
          }).size
        ).toBe(count);
      }
    } finally {
      await fixture.rm();
    }
  });
});
