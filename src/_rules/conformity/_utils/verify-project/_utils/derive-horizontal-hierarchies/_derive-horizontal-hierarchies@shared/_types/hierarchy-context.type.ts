import type {
  TEffectiveTree,
  TInventoryItem,
  TTaxonomyModel,
} from '../../../../_verify-project@shared/_types/verification-model.type.js';

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
