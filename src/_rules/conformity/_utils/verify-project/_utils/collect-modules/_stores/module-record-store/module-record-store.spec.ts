import { createFixture } from 'fs-fixture';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

import { calculateContentKey } from './_utils/calculate-content-key/index.js';
import { readModuleRecordCache } from './_utils/read-module-record-cache/index.js';
import { writeModuleRecordCache } from './_utils/write-module-record-cache/index.js';
import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from './module-record-store.constant.js';
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
    const key = calculateContentKey(
      path,
      text,
      MODULE_RECORD_CACHE_SCHEMA_VERSION
    );
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
    const key = calculateContentKey(
      path,
      text,
      MODULE_RECORD_CACHE_SCHEMA_VERSION
    );
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
      [
        calculateContentKey(path, text, MODULE_RECORD_CACHE_SCHEMA_VERSION),
        record,
      ],
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

  it('loads and saves persistent cache across baseDirectory changes', async () => {
    const first = await createFixture({});
    const second = await createFixture({});
    try {
      const path = 'src/a.ts';
      const text = 'export const a = 1;';
      const record = createDummyRecord('a');

      moduleRecordStore.loadCache(first.path, '0.5.0');
      const wrapped = moduleRecordStore.wrapProducer(() => record);
      expect(wrapped(path, text)).toBe(record);
      moduleRecordStore.saveCache(first.path, '0.5.0');

      const cacheFile = nodePath.join(
        first.path,
        'node_modules/.cache/eslint-plugin-faf/records.cache'
      );
      expect(nodeFs.existsSync(cacheFile)).toBe(true);

      moduleRecordStore.loadCache(first.path, '0.5.0');
      const sameDirectorySpy: TModuleRecordProducer = vi.fn(() =>
        createDummyRecord('reproduced')
      );
      expect(moduleRecordStore.wrapProducer(sameDirectorySpy)(path, text)).toBe(
        record
      );
      expect(sameDirectorySpy).toHaveBeenCalledTimes(0);

      moduleRecordStore.loadCache(second.path, '0.5.0');
      const otherDirectorySpy: TModuleRecordProducer = vi.fn(() =>
        createDummyRecord('fresh')
      );
      expect(
        moduleRecordStore.wrapProducer(otherDirectorySpy)(path, text).symbols[0]
          ?.name
      ).toBe('fresh');
      expect(otherDirectorySpy).toHaveBeenCalledTimes(1);
    } finally {
      await first.rm();
      await second.rm();
    }
  });

  it('replaces persistent entries instead of merging them', () => {
    const replacedPath = 'src/replaced.ts';
    const replacedText = 'const replaced = 1;';
    const keptPath = 'src/kept.ts';
    const keptText = 'const kept = 2;';
    const replacedKey = calculateContentKey(
      replacedPath,
      replacedText,
      MODULE_RECORD_CACHE_SCHEMA_VERSION
    );
    const keptKey = calculateContentKey(
      keptPath,
      keptText,
      MODULE_RECORD_CACHE_SCHEMA_VERSION
    );
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
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
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
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
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
});
