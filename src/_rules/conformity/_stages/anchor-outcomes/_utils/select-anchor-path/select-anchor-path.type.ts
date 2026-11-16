import type { TOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TInventory,
  TTaxonomyModel,
} from '../../../../_conformity@shared/_types/verification-model.type.js';

/**
 * Facts required to choose the single absolute file that reports one outcome.
 */
export type TSelectAnchorPathInput = {
  /**
   * Absolute directory that hosts faf.config.ts and anchors relative inventory paths.
   */
  readonly baseDirectory: string;

  /**
   * Absolute path of the configuration file used when no lintable anchor exists.
   */
  readonly configPath: string;

  /**
   * Inventory of the project, absent when verification stopped before listing entries.
   */
  readonly inventory?: TInventory;

  /**
   * Taxonomy model, absent when verification stopped before classification.
   */
  readonly model?: TTaxonomyModel;

  /**
   * Outcome whose element and family determine the anchor.
   */
  readonly outcome: TOutcome;
};
