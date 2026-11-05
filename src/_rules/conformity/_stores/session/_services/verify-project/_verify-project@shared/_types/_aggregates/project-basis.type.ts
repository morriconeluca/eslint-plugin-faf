import type { TOutcome } from '../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TEffectiveDeclarations,
  TEffectivePathAlias,
} from '../_primitives/declarations.type.js';
import type { TInventory } from '../_primitives/inventory.type.js';

/**
 * Ready project preparation consumed by classification, collection, and later stages.
 */
export type TProjectBasis = {
  /**
   * Path aliases acquired for the project.
   */
  readonly aliases: readonly TEffectivePathAlias[];

  /**
   * Absolute directory that hosts fafconfig.ts.
   */
  readonly baseDirectory: string;

  /**
   * Absolute path of fafconfig.ts.
   */
  readonly configPath: string;

  /**
   * Effective declarations composed for every Fractal Tree.
   */
  readonly declarations: TEffectiveDeclarations;

  /**
   * Inventory of the declared tree origins and reached local files.
   */
  readonly inventory: TInventory;

  /**
   * Non-blocking outcomes discovered while building the inventory.
   */
  readonly inventoryOutcomes: readonly TOutcome[];

  /**
   * Discriminant of a preparation that later stages may continue.
   */
  readonly kind: 'ready';

  /**
   * Absolute paths of local files loaded while evaluating fafconfig.ts.
   */
  readonly loadedFiles: readonly string[];
};
