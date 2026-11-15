import type { TDependencyOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEdgeMetadata,
  TEffectiveDeclarations,
  TEffectiveRootFragment,
  THorizontalHierarchies,
  TInventoryItem,
  TVerificationModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';
import type { TResolvedRootEdge } from './root-node-discipline.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';

export function checkEdgeRootDiscipline(
  edge: TEdgeMetadata,
  model: TVerificationModel
): TDependencyOutcome | undefined {
  const resolved = resolveRootEdge(edge, model);
  if (resolved === undefined) {
    return undefined;
  }

  const isAuthorized =
    resolved.isSourceRootNode &&
    isRootEdgeAuthorized(
      resolved.sourceItem,
      resolved.destinationItem,
      edge,
      model,
      resolved.treeOrigin
    );

  if (isAuthorized) {
    return undefined;
  }

  return createOutcome('dependency/root-node-discipline', {
    from: edge.sourcePath,
    importIndex: edge.importIndex,
    position: edge.position,
    specifier: edge.specifier,
    to: edge.destinationPath,
  });
}

export function isAuthorizedRootDependency(
  sourcePath: string,
  destinationPath: string,
  sourceParentPath: string,
  treeOrigin: string,
  declarations: TEffectiveDeclarations
): boolean {
  const tree = declarations.trees.find(
    (candidate) => candidate.originPath === treeOrigin
  );
  if (tree === undefined) {
    return false;
  }

  const fragments: TEffectiveRootFragment[] = [...tree.rootFragments];
  let current = fragments.shift();
  while (current !== undefined) {
    if (current.path === sourceParentPath) {
      return current.dependencyPairs.some(
        (pair) => pair.from === sourcePath && pair.to === destinationPath
      );
    }
    fragments.push(...current.subRootFragments);
    current = fragments.shift();
  }

  return false;
}

export function isRootEdgeAuthorized(
  sourceItem: TInventoryItem,
  destinationItem: TInventoryItem,
  edge: TEdgeMetadata,
  model: TVerificationModel,
  treeOrigin: string
): boolean {
  if (edge.aliasUsed !== null) {
    return false;
  }

  const sourceParentId = sourceItem.parentId;
  const sourceParentItem =
    sourceParentId === null
      ? undefined
      : model.basis.inventory.items[sourceParentId];
  const destinationParentId = destinationItem.parentId;

  if (sourceParentItem === undefined || destinationParentId === null) {
    return false;
  }

  return sourceParentId === destinationParentId
    ? isStrictlyDescendingRoot(
        sourceItem.id,
        destinationItem.id,
        sourceParentItem.path,
        model.hierarchies
      )
    : isAuthorizedRootDependency(
        edge.sourcePath,
        edge.destinationPath,
        sourceParentItem.path,
        treeOrigin,
        model.basis.declarations
      );
}

export function isStrictlyDescendingRoot(
  sourceId: number,
  destinationId: number,
  parentPath: string,
  hierarchies: THorizontalHierarchies
): boolean {
  const hierarchySet = hierarchies.sets.find(
    (set) => set.origin === 'root-nodes' && set.parentPath === parentPath
  );
  if (
    hierarchySet === undefined ||
    !hierarchySet.isOrderable ||
    hierarchySet.repetitions.length > 0
  ) {
    return false;
  }

  const conflictingIds = new Set(
    hierarchies.conflicts.map((conflict) => conflict.itemId)
  );
  if (conflictingIds.has(sourceId) || conflictingIds.has(destinationId)) {
    return false;
  }

  const sourceSiblings = hierarchySet.siblings.filter(
    (sibling) => sibling.itemId === sourceId
  );
  const destinationSiblings = hierarchySet.siblings.filter(
    (sibling) => sibling.itemId === destinationId
  );
  if (sourceSiblings.length !== 1 || destinationSiblings.length !== 1) {
    return false;
  }

  const sourceSibling = sourceSiblings[0];
  const destinationSibling = destinationSiblings[0];
  return (
    sourceSibling !== undefined &&
    destinationSibling !== undefined &&
    sourceSibling.rank > destinationSibling.rank
  );
}

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

  const { inventory } = model.basis;
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
    treeOrigin: sourceItem.treeOrigin,
  };
}
