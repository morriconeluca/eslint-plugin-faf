import type { TEdgeMetadata } from '../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';
import type { TVerificationModel } from '../../../../../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TResolvedRootEdge } from './resolve-root-edge.type.js';

export function resolveRootEdge(
  edge: TEdgeMetadata,
  model: TVerificationModel
): TResolvedRootEdge | undefined {
  const destinationClassification = model.taxonomy.byPath.get(
    edge.destinationPath
  );
  if (
    destinationClassification?.nodeKind !== 'root-node' ||
    edge.sourcePath === edge.destinationPath
  ) {
    return undefined;
  }

  const sourceClassification = model.taxonomy.byPath.get(edge.sourcePath);
  if (
    sourceClassification === undefined ||
    sourceClassification.nodeKind === 'foreign-node'
  ) {
    return undefined;
  }

  const inventory = model.basis.inventory;
  const destinationItem = inventory.items[destinationClassification.itemId];
  const sourceItem = inventory.items[sourceClassification.itemId];
  if (
    sourceItem === undefined ||
    destinationItem === undefined ||
    sourceItem.treeOrigin === null ||
    sourceItem.treeOrigin !== destinationItem.treeOrigin
  ) {
    return undefined;
  }

  return {
    destinationItem,
    isSourceRootNode: sourceClassification.nodeKind === 'root-node',
    sourceItem,
  };
}
