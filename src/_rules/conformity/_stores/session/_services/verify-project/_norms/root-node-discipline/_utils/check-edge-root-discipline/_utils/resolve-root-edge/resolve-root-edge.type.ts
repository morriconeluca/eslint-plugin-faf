import type { TInventoryItem } from '../../../../../../_verify-project@shared/_types/_primitives/inventory.type.js';

/**
 * Resolved endpoints and classification status of an edge targeting a Root Node.
 */
export type TResolvedRootEdge = {
  /**
   * Inventory item corresponding to the destination Root Node.
   */
  readonly destinationItem: TInventoryItem;

  /**
   * Indicates whether the originating source item is qualified as a Root Node.
   */
  readonly isSourceRootNode: boolean;

  /**
   * Inventory item corresponding to the originating source file.
   */
  readonly sourceItem: TInventoryItem;
};
