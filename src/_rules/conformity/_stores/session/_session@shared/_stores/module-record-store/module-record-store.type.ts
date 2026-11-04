import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../_types/module-record.type.js';

/**
 * In-memory process store managing cached module records across ESLint execution.
 */
export type TModuleRecordStore = {
  /**
   * Wipes all entries from both in-memory and persistent cache tiers.
   */
  readonly clear: () => void;

  /**
   * Retrieves records used since the last persistent load: cache hits and records produced after that load.
   */
  readonly getAllEntries: () => ReadonlyMap<string, TModuleRecord>;

  /**
   * Replaces the persistent tier and starts a new load window. Loaded records stay available for lookup but are not persisted again until used.
   */
  readonly setPersistentEntries: (
    entries: ReadonlyMap<string, TModuleRecord>
  ) => void;

  /**
   * Wraps an underlying module record producer with two-tier caching semantics.
   */
  readonly wrapProducer: (
    producer: TModuleRecordProducer,
    options?: TWrapProducerOptions
  ) => TModuleRecordProducer;
};

/**
 * Options configuring store hydration when wrapping a module record producer.
 */
export type TWrapProducerOptions = {
  /**
   * Initial persistent module record entries to seed into the persistent cache tier.
   */
  readonly persistentEntries?: ReadonlyMap<string, TModuleRecord>;
};
