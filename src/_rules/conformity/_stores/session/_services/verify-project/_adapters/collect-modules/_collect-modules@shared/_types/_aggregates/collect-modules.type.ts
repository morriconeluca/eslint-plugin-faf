import type { TUnverifiedOutcome } from '../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TEffectivePathAlias } from '../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TSpecifierResolver } from '../_compounds/specifier-resolver.type.js';

/**
 * Input of the pure analysis step after the file text has been acquired.
 */
export type TAnalyzeModuleSourceInput = {
  /**
   * Inventory used to distinguish Tree files from local external files.
   */
  readonly inventory: TInventory;

  /**
   * Producer invoked with the acquired text, or with an empty string when undecodable.
   */
  readonly producer: TModuleRecordProducer;

  /**
   * Read or override result for the file being analyzed.
   */
  readonly readResult: TReadModuleTextResult;

  /**
   * POSIX path relative to the base identifying the file being analyzed.
   */
  readonly relativePath: string;

  /**
   * Resolver invoked with the produced import list.
   */
  readonly resolver: TSpecifierResolver;
};

/**
 * Input of the effectful step that reads one queued module and analyzes it.
 */
export type TAnalyzeQueuedModuleInput = {
  /**
   * Canonical absolute base directory used to join relative paths.
   */
  readonly baseDirectory: string;

  /**
   * Inventory used to classify read failures of Tree files versus external files.
   */
  readonly inventory: TInventory;

  /**
   * Producer received by the collection adapter.
   */
  readonly producer: TModuleRecordProducer;

  /**
   * POSIX path relative to the base of the queued file.
   */
  readonly relativePath: string;

  /**
   * Resolver received by the collection adapter.
   */
  readonly resolver: TSpecifierResolver;

  /**
   * Lint-file text overrides keyed by POSIX path relative to the base.
   */
  readonly textOverrides: ReadonlyMap<string, string>;
};

/**
 * Arguments of the synchronous module collection adapter.
 */
export type TCollectModulesInput = {
  /**
   * Path aliases acquired for the project, passed to the specifier resolver.
   */
  readonly aliases: readonly TEffectivePathAlias[];

  /**
   * Project base directory used by the inventory and the specifier resolver.
   */
  readonly baseDirectory: string;

  /**
   * Inventory of Fractal Tree files whose paths are POSIX and relative to the base.
   */
  readonly inventory: TInventory;

  /**
   * Lint-file text keyed by POSIX path relative to the base, replacing disk content.
   */
  readonly textOverrides: ReadonlyMap<string, string>;
};

/**
 * Analysis of one module file before path ordering.
 */
export type TModuleAnalysis = {
  /**
   * Unverified outcomes discovered while producing or resolving this file.
   */
  readonly outcomes: readonly TUnverifiedOutcome[];

  /**
   * Produced Module Record, or null when the file must not be treated as a leaf.
   */
  readonly record: null | TModuleRecord;

  /**
   * Resolutions aligned with the record imports, empty when resolution did not run.
   */
  readonly resolutions: readonly TImportResolution[];
};

/**
 * Failure kinds produced while reading or decoding a module file.
 */
export type TModuleReadFailureKind =
  | 'directory'
  | 'missing'
  | 'undecodable'
  | 'unreadable';

/**
 * Bytes decoded as text, or a reason the file could not be supplied as text.
 */
export type TReadModuleTextResult =
  | {
      /**
       * Discriminant for text that can be passed to the producer.
       */
      readonly status: 'text';

      /**
       * UTF-8 text acquired from disk.
       */
      readonly text: string;
    }
  | {
      /**
       * Technical reason decoding or reading failed.
       */
      readonly reason: string;

      /**
       * Discriminant for a missing, directory, unreadable, or undecodable file.
       */
      readonly status: TModuleReadFailureKind;
    };

/**
 * Unordered maps accumulated while exploring modules.
 */
export type TUnorderedModuleCollection = {
  /**
   * Records inserted in visit order.
   */
  readonly records: ReadonlyMap<string, TModuleRecord>;

  /**
   * Resolutions inserted in visit order.
   */
  readonly resolutions: ReadonlyMap<string, readonly TImportResolution[]>;

  /**
   * Unverified outcomes accumulated in visit order.
   */
  readonly unverifiedOutcomes: readonly TUnverifiedOutcome[];
};
