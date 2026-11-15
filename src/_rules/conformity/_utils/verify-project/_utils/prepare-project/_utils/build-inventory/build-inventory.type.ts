import type {
  TBuildInventoryResult as TBuildInventorySharedResult,
  TGroupTreeNodesResult as TGroupTreeNodesSharedResult,
  TInProgressInventoryEntry as TInProgressInventorySharedEntry,
} from './_build-inventory@shared/_types/build-inventory.type.js';

/**
 * Result structure produced by the pure inventory assembly pipeline.
 */
export type TBuildInventoryResult = TBuildInventorySharedResult;

/**
 * Intermediate grouping of inventory nodes by roots and adjacency children lists.
 */
export type TGroupTreeNodesResult = TGroupTreeNodesSharedResult;

/**
 * Representation of an inventory node being assembled during tree construction.
 */
export type TInProgressInventoryEntry = TInProgressInventorySharedEntry;
