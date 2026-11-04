import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../_types/module-record.type.js';
import type {
  TModuleRecordStore,
  TWrapProducerOptions,
} from './module-record-store.type.js';

import { calculateContentKey } from './_utils/calculate-content-key/index.js';

export const moduleRecordStore: TModuleRecordStore = (() => {
  const inMemoryCache = new Map<string, TModuleRecord>();
  const persistentCache = new Map<string, TModuleRecord>();
  const usedSinceLoad = new Map<string, TModuleRecord>();

  const clear = (): void => {
    inMemoryCache.clear();
    persistentCache.clear();
    usedSinceLoad.clear();
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

  const wrapProducer = (
    producer: TModuleRecordProducer,
    options?: TWrapProducerOptions
  ): TModuleRecordProducer => {
    if (options?.persistentEntries !== undefined) {
      setPersistentEntries(options.persistentEntries);
    }

    return (path: string, text: string): TModuleRecord => {
      const key = calculateContentKey(path, text);
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
    setPersistentEntries,
    wrapProducer,
  };
})();
