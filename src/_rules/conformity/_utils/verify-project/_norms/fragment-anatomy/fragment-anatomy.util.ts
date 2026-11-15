import type { TClassificationOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  TInventoryItem,
  TItemClassification,
  TVerificationModel,
} from '../../_verify-project@shared/_types/verification-model.type.js';
import type { TFragmentInspection } from './fragment-anatomy.type.js';

import { createOutcome } from '../../../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import {
  ADMITTED_NODE_KINDS,
  FRAGMENT_OR_SUB_GRAPH_KINDS,
  MASTER_CANDIDATE_KINDS,
  NODE_ACCESS,
  NODE_FRAGMENT,
} from './fragment-anatomy.constant.js';

export function collectFragmentItems(
  model: TVerificationModel
): readonly TFragmentInspection[] {
  const treeByOrigin = new Map<null | string, TEffectiveTree>(
    model.basis.declarations.trees.map((tree) => [tree.originPath, tree])
  );

  const fileChildrenByParentId = new Map<number, TInventoryItem[]>();
  for (const item of model.basis.inventory.items) {
    if (item.kind !== 'file' || item.parentId === null) {
      continue;
    }
    const list = fileChildrenByParentId.get(item.parentId) ?? [];
    list.push(item);
    fileChildrenByParentId.set(item.parentId, list);
  }

  const isFragmentClassification = (
    classification: TItemClassification | undefined
  ): classification is TItemClassification =>
    classification !== undefined &&
    classification.domainKind === 'fragment' &&
    classification.imposedRoleName !== null;

  const fragmentTargets: {
    readonly classification: TItemClassification;
    readonly item: TInventoryItem;
  }[] = [];

  for (const item of model.basis.inventory.items) {
    if (item.kind !== 'directory') {
      continue;
    }
    const classification = model.taxonomy.byItemId.get(item.id);
    if (isFragmentClassification(classification)) {
      fragmentTargets.push({ classification, item });
    }
  }

  const resolveMasterRank = (
    item: TInventoryItem,
    roleName: null | string
  ): null | number => {
    if (roleName === null) {
      return null;
    }
    const tree = treeByOrigin.get(item.treeOrigin);
    const imposedRole = tree?.catalog.roles.find(
      (role) => role.name === roleName
    );
    return imposedRole?.rank ?? null;
  };

  const toLogicalChild = (child: TInventoryItem): TItemClassification[] => {
    const childClassification = model.taxonomy.byItemId.get(child.id);
    return childClassification === undefined ||
      childClassification.nodeKind === null ||
      childClassification.nodeKind === 'foreign-node'
      ? []
      : [childClassification];
  };

  const inspections: TFragmentInspection[] = [];

  for (const { classification, item } of fragmentTargets) {
    const masterRank = resolveMasterRank(item, classification.imposedRoleName);

    const rawFileChildren = fileChildrenByParentId.get(item.id);
    const sortedChildren =
      rawFileChildren === undefined ? [] : [...rawFileChildren];
    sortedChildren.sort((left, right) => compareOrdinal(left.path, right.path));

    const logicalChildren = sortedChildren.flatMap((child) =>
      toLogicalChild(child)
    );

    inspections.push({
      fragmentClassification: classification,
      logicalChildren,
      masterRank,
    });
  }

  return inspections;
}

export function inspectFragmentDomain(
  inspection: TFragmentInspection
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];
  const fragmentPath = inspection.fragmentClassification.path;
  const imposedRoleName = inspection.fragmentClassification.imposedRoleName;

  const hasAccessNode = inspection.logicalChildren.some(
    (child) => child.nodeKind === NODE_ACCESS
  );
  if (!hasAccessNode) {
    outcomes.push(
      createOutcome.classification('classification/missing-access-node', {
        element: fragmentPath,
      })
    );
  }

  const hasMasterCandidate = inspection.logicalChildren.some(
    (child) =>
      child.role.roleName === imposedRoleName &&
      MASTER_CANDIDATE_KINDS.has(child.nodeKind)
  );
  if (!hasMasterCandidate) {
    outcomes.push(
      createOutcome.classification('classification/missing-master-node', {
        element: fragmentPath,
      })
    );
  }

  const explicitRoleCounts = new Map<string, number>();
  for (const child of inspection.logicalChildren) {
    const roleName = child.role.roleName;
    if (roleName === null || !FRAGMENT_OR_SUB_GRAPH_KINDS.has(child.nodeKind)) {
      continue;
    }
    const current = explicitRoleCounts.get(roleName) ?? 0;
    explicitRoleCounts.set(roleName, current + 1);
  }

  const duplicatedRoleNames: string[] = [];
  for (const [roleName, count] of explicitRoleCounts) {
    if (count > 1) {
      duplicatedRoleNames.push(roleName);
    }
  }
  duplicatedRoleNames.sort(compareOrdinal);

  const duplicateOutcomes = duplicatedRoleNames.map(() =>
    createOutcome.classification('classification/duplicate-fragment-role', {
      element: fragmentPath,
    })
  );
  outcomes.push(...duplicateOutcomes);

  return outcomes;
}

export function inspectFragmentNodes(
  inspection: TFragmentInspection
): readonly TClassificationOutcome[] {
  const outcomes: TClassificationOutcome[] = [];

  for (const child of inspection.logicalChildren) {
    if (!ADMITTED_NODE_KINDS.has(child.nodeKind)) {
      outcomes.push(
        createOutcome.classification('classification/fragment-node-anatomy', {
          element: child.path,
        })
      );
    }
  }

  const masterRank = inspection.masterRank;
  const imposedRoleName = inspection.fragmentClassification.imposedRoleName;

  if (masterRank !== null && imposedRoleName !== null) {
    for (const child of inspection.logicalChildren) {
      const isOtherFragmentNode =
        child.nodeKind === NODE_FRAGMENT &&
        child.role.roleName !== imposedRoleName;

      if (
        isOtherFragmentNode &&
        child.fragmentInternalRank !== null &&
        child.fragmentInternalRank >= masterRank
      ) {
        outcomes.push(
          createOutcome.classification('classification/fragment-node-rank', {
            element: child.path,
          })
        );
      }
    }
  }

  return outcomes;
}
