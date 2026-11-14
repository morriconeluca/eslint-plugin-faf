import type { TOutcome } from '../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TEffectiveDeclarations,
  TEffectivePathAlias,
} from '../_primitives/declarations.type.js';
import type { TInventory } from '../_primitives/inventory.type.js';

/**
 * Validated project preparation consumed by taxonomy, graph, and norm verification.
 */
export type TProjectBasis = {
  /**
   * Path aliases acquired for the project.
   */
  readonly aliases: readonly TEffectivePathAlias[];

  /**
   * Absolute directory that hosts faf.config.ts.
   */
  readonly baseDirectory: string;

  /**
   * Absolute path of faf.config.ts.
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
   * Discriminant of a validated project preparation ready for verification.
   */
  readonly kind: 'ready';

  /**
   * Absolute paths of local files loaded while evaluating faf.config.ts.
   */
  readonly loadedFiles: readonly string[];
};
