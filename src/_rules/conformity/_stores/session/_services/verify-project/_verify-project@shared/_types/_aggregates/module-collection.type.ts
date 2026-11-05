import type { TUnverifiedOutcome } from '../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TModuleRecord } from '../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../_compounds/dependency-graph.type.js';

/**
 * Module Records, resolutions, and unverified outcomes collected for the project.
 */
export type TModuleCollection = {
  /**
   * Module Records keyed by POSIX path relative to the configuration directory.
   */
  readonly records: ReadonlyMap<string, TModuleRecord>;

  /**
   * Import resolutions keyed by source path, in Module Record import order.
   */
  readonly resolutions: ReadonlyMap<string, readonly TImportResolution[]>;

  /**
   * Unverified outcomes for files and imports that could not be analyzed.
   */
  readonly unverifiedOutcomes: readonly TUnverifiedOutcome[];
};
