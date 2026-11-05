import type { TTaxonomyModel } from '../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Direct sibling inventory and its already classified parent in one Tree.
 */
export type THierarchyContext = {
  /**
   * Direct children in inventory order; no traversal beyond this sibling level.
   */
  readonly children: readonly TInventoryItem[];

  /**
   * Parent directory inventory record.
   */
  readonly parent: TInventoryItem;

  /**
   * Existing classification, never inferred from hierarchy membership.
   */
  readonly taxonomy: TTaxonomyModel;

  /**
   * Effective declarations belonging to this parent Tree.
   */
  readonly tree: TEffectiveTree;
};
