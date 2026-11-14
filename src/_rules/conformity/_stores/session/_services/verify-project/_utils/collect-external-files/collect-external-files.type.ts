import type { TModuleCollection } from '../../_verify-project@shared/_types/_aggregates/module-collection.type.js';
import type { TInventory } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Input arguments for collecting external local files observed during verification.
 */
export type TCollectExternalFilesInput = {
  /**
   * Absolute path of the directory hosting faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Comprehensive inventory model indexing all discovered codebase elements.
   */
  readonly inventory: TInventory;

  /**
   * Module collection containing all analyzed module records.
   */
  readonly modules: TModuleCollection;

  /**
   * Absolute paths of all declared tree origin directories.
   */
  readonly treeOrigins: readonly string[];
};
