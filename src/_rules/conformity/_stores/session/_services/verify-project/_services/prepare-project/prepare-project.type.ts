import type { TOutcome } from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TEffectiveDeclarations,
  TEffectivePathAlias,
} from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventory } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Blocking prefix of verification: configuration, declarations, and inventory.
 */
export type TPrepareProjectResult =
  | {
      /**
       * Absolute directory hosting fafconfig.ts.
       */
      readonly baseDirectory: string;

      /**
       * Absolute path of fafconfig.ts.
       */
      readonly configPath: string;

      /**
       * Discriminant for a prefix that must not continue into classification.
       */
      readonly kind: 'blocked';

      /**
       * Local files loaded while evaluating fafconfig.ts, empty when loading failed.
       */
      readonly loadedFiles: readonly string[];

      /**
       * Outcomes that stop the pipeline.
       */
      readonly outcomes: readonly TOutcome[];
    }
  | {
      /**
       * Path aliases acquired from package.json or the common configuration.
       */
      readonly aliases: readonly TEffectivePathAlias[];

      /**
       * Absolute directory hosting fafconfig.ts.
       */
      readonly baseDirectory: string;

      /**
       * Absolute path of fafconfig.ts.
       */
      readonly configPath: string;

      /**
       * Effective declarations composed for every fractal tree.
       */
      readonly declarations: TEffectiveDeclarations;

      /**
       * Inventory of the declared tree origins.
       */
      readonly inventory: TInventory;

      /**
       * Non-blocking outcomes discovered while building the inventory.
       */
      readonly inventoryOutcomes: readonly TOutcome[];

      /**
       * Discriminant for a prefix that classification may continue.
       */
      readonly kind: 'ready';

      /**
       * Local files loaded while evaluating fafconfig.ts.
       */
      readonly loadedFiles: readonly string[];
    };
