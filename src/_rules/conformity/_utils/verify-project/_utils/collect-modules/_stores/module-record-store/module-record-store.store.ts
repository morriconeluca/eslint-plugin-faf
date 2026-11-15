import nodeCrypto from 'node:crypto';

import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TModuleRecordStore,
  TWrapProducerOptions,
} from './module-record-store.type.js';

import { toPosixPath } from '../../../../../../../../_src@shared/_utils/to-posix-path/index.js';
import { readModuleRecordCache } from './_utils/read-module-record-cache/index.js';
import { writeModuleRecordCache } from './_utils/write-module-record-cache/index.js';
import { MODULE_RECORD_CACHE_SCHEMA_VERSION } from './module-record-store.constant.js';

export const moduleRecordStore: TModuleRecordStore = (() => {
  const inMemoryCache = new Map<string, TModuleRecord>();
  const persistentCache = new Map<string, TModuleRecord>();
  const usedSinceLoad = new Map<string, TModuleRecord>();
  let activeBaseDirectory: null | string = null;

  const calculateContentKey = (
    path: string,
    text: string,
    schemaVersion: number
  ): string =>
    nodeCrypto
      .createHash('sha256')
      .update(String(schemaVersion))
      .update('\0')
      .update(toPosixPath(path))
      .update('\0')
      .update(text)
      .digest('hex');

  const clear = (): void => {
    inMemoryCache.clear();
    persistentCache.clear();
    usedSinceLoad.clear();
    activeBaseDirectory = null;
  };

  const getAllEntries = (): ReadonlyMap<string, TModuleRecord> =>
    new Map(usedSinceLoad);

  const setPersistentEntries = (
    entries: ReadonlyMap<string, TModuleRecord>
  ): void => {
    persistentCache.clear();
    usedSinceLoad.clear();
    for (const [key, record] of entries) {
      persistentCache.set(key, record);
    }
  };

  const loadCache = (baseDirectory: string, packageVersion: string): void => {
    if (activeBaseDirectory !== baseDirectory) {
      inMemoryCache.clear();
      activeBaseDirectory = baseDirectory;
    }
    setPersistentEntries(
      readModuleRecordCache({
        baseDirectory,
        packageVersion,
        schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
      })
    );
  };

  const saveCache = (baseDirectory: string, packageVersion: string): void => {
    writeModuleRecordCache({
      baseDirectory,
      entries: getAllEntries(),
      packageVersion,
      schemaVersion: MODULE_RECORD_CACHE_SCHEMA_VERSION,
    });
  };

  const wrapProducer = (
    producer: TModuleRecordProducer,
    options?: TWrapProducerOptions
  ): TModuleRecordProducer => {
    if (options?.persistentEntries !== undefined) {
      setPersistentEntries(options.persistentEntries);
    }

    return (path: string, text: string): TModuleRecord => {
      const key = calculateContentKey(
        path,
        text,
        MODULE_RECORD_CACHE_SCHEMA_VERSION
      );
      const inMemoryMatch = inMemoryCache.get(key);
      if (inMemoryMatch !== undefined) {
        usedSinceLoad.set(key, inMemoryMatch);
        return inMemoryMatch;
      }

      const persistentMatch = persistentCache.get(key);
      if (persistentMatch !== undefined) {
        inMemoryCache.set(key, persistentMatch);
        usedSinceLoad.set(key, persistentMatch);
        return persistentMatch;
      }

      const freshRecord = producer(path, text);
      inMemoryCache.set(key, freshRecord);
      usedSinceLoad.set(key, freshRecord);
      return freshRecord;
    };
  };

  return {
    clear,
    getAllEntries,
    loadCache,
    saveCache,
    setPersistentEntries,
    wrapProducer,
  };
})();
