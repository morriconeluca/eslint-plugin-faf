import type { TConfigOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveTree,
  TInventory,
  TInventoryItem,
  TItemClassification,
} from '../../_conformity@shared/_types/verification-model.type.js';
import type {
  TClassificationDraft,
  TDirectoryParent,
} from './_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import {
  ABSENT_ROLE_KIND,
  DOMAIN_FRAGMENT,
  UNDERSCORE,
} from './_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from './_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { buildTreeContext } from './_utils/build-tree-context/index.js';
import { classifyDirectory } from './_utils/classify-directory/index.js';
import { classifyFile } from './_utils/classify-file/index.js';
import { finalizeClassifications } from './_utils/finalize-classifications/index.js';
import { getRoleFromName } from './_utils/get-role-from-name/index.js';
import { selectForeignNodes } from './_utils/select-foreign-nodes/index.js';
import { verifyClassificationReferences } from './_utils/verify-classification-references/index.js';

const ABSENT_ROLE = { kind: ABSENT_ROLE_KIND, roleName: null } as const;

export function classifyOneTree(
  inventory: TInventory,
  itemsByParentId: ReadonlyMap<number, readonly TInventoryItem[]>,
  tree: TEffectiveTree,
  treeIndex: number
): {
  readonly classifications: readonly TItemClassification[];
  readonly outcomes: readonly TConfigOutcome[];
} {
  const originId = inventory.pathToId.get(tree.originPath);
  if (originId === undefined) {
    return { classifications: [], outcomes: [] };
  }
  const originItem = inventory.items[originId];
  if (originItem === undefined || originItem.kind !== 'directory') {
    return { classifications: [], outcomes: [] };
  }
  const selection = selectForeignNodes(inventory, tree);
  const treeBuild = buildTreeContext(
    tree,
    treeIndex,
    getRoleFromName,
    selection
  );
  const outcomes: TConfigOutcome[] = [...treeBuild.outcomes];
  const drafts = new Map<number, TClassificationDraft>();
  const childrenByParentId = new Map<number, number[]>();
  drafts.set(originItem.id, {
    domainKind: tree.originKind,
    entryKind: originItem.kind,
    form: null,
    fragmentInternalRank: null,
    imposedRoleName: null,
    isPathFragment: false,
    isPrivateCategory: false,
    isSubFragment: false,
    isSubLayer: false,
    itemId: originItem.id,
    nodeKind: null,
    parentFragmentPath: null,
    path: originItem.path,
    role: ABSENT_ROLE,
  });

  const recordFile = (
    child: TInventoryItem,
    parent: TDirectoryParent
  ): void => {
    const classified = classifyFile(child.path, parent, treeBuild.context);
    if (classified.conflict !== null) {
      const isContradictory =
        classified.conflict === 'contradictory-root-foreign';
      const propertyPath = isContradictory
        ? (treeBuild.rootNodePropertyPaths.get(child.path) ??
          `trees[${treeIndex}].rootFragments`)
        : (treeBuild.rootFragmentPropertyPaths.get(parent.path) ??
          `trees[${treeIndex}].rootFragments`);
      outcomes.push(
        createOutcome.configuration(
          isContradictory
            ? 'configuration/contradictory-root-foreign'
            : 'configuration/unenumerated-root-file',
          {
            element: child.path,
            propertyPath,
          }
        )
      );
    }
    drafts.set(child.id, {
      ...classified.fields,
      entryKind: child.kind,
      itemId: child.id,
      path: child.path,
    });
  };

  const recordUndeclaredFrontier = (
    child: TInventoryItem,
    parent: TDirectoryParent
  ): void => {
    const fragmentPropertyPath = treeBuild.rootFragmentPropertyPaths.get(
      parent.path
    );
    const fragmentBase =
      fragmentPropertyPath ?? `trees[${treeIndex}].rootFragments`;
    const propertyPath = `${fragmentBase}.subRootFragments`;
    outcomes.push(
      createOutcome.configuration(
        'configuration/undeclared-sub-root-fragment',
        {
          element: child.path,
          propertyPath,
        }
      )
    );
    drafts.set(child.id, {
      domainKind: null,
      entryKind: child.kind,
      form: null,
      fragmentInternalRank: null,
      imposedRoleName: null,
      isPathFragment: false,
      isPrivateCategory: false,
      isSubFragment: false,
      isSubLayer: false,
      itemId: child.id,
      nodeKind: null,
      parentFragmentPath: parent.parentFragmentPath,
      path: child.path,
      role: ABSENT_ROLE,
    });
  };

  const visit = (item: TInventoryItem, parent: TDirectoryParent): void => {
    const children = itemsByParentId.get(item.id) ?? [];
    for (const child of children) {
      const recordedIds = childrenByParentId.get(item.id);
      const siblingIds =
        recordedIds === undefined ? [child.id] : [...recordedIds, child.id];
      childrenByParentId.set(item.id, siblingIds);
      if (child.kind === 'file') {
        recordFile(child, parent);
      } else {
        const name = readPathName(child.path);
        const isUndeclaredFrontier =
          parent.domainKind === 'root-fragment' &&
          !name.startsWith(UNDERSCORE) &&
          !treeBuild.context.rootFragmentPaths.has(child.path) &&
          !treeBuild.context.foreignDomainPaths.has(child.path);
        if (isUndeclaredFrontier) {
          recordUndeclaredFrontier(child, parent);
          visit(child, {
            domainKind: null,
            form: null,
            imposedRoleName: null,
            isMimeticContext: false,
            parentFragmentPath: parent.parentFragmentPath,
            path: child.path,
          });
        } else {
          const classification = classifyDirectory(
            child.path,
            parent,
            treeBuild.context
          );
          drafts.set(child.id, {
            domainKind: classification.domainKind,
            entryKind: child.kind,
            form: classification.form,
            fragmentInternalRank: null,
            imposedRoleName: classification.imposedRoleName,
            isPathFragment: classification.isPathFragment,
            isPrivateCategory: classification.isPrivateCategory,
            isSubFragment: classification.isSubFragment,
            isSubLayer: classification.isSubLayer,
            itemId: child.id,
            nodeKind: null,
            parentFragmentPath: classification.parentFragmentPath,
            path: child.path,
            role: ABSENT_ROLE,
          });
          const nextFragmentPath =
            classification.domainKind === DOMAIN_FRAGMENT
              ? child.path
              : classification.parentFragmentPath;
          visit(child, {
            domainKind: classification.domainKind,
            form: classification.form,
            imposedRoleName: classification.imposedRoleName,
            isMimeticContext: classification.isMimeticContext,
            parentFragmentPath: nextFragmentPath,
            path: child.path,
          });
        }
      }
    }
  };

  visit(originItem, {
    domainKind: tree.originKind,
    form: null,
    imposedRoleName: null,
    isMimeticContext: false,
    parentFragmentPath: null,
    path: originItem.path,
  });
  const finalized = finalizeClassifications(
    drafts,
    childrenByParentId,
    treeBuild.context.mimeticPaths
  );
  outcomes.push(
    ...verifyClassificationReferences(finalized, tree, treeIndex, treeBuild)
  );
  return { classifications: finalized, outcomes };
}

export function compareConfigOutcomes(
  left: TConfigOutcome,
  right: TConfigOutcome
): number {
  const byConstraint = compareOrdinal(left.constraint, right.constraint);
  if (byConstraint !== 0) {
    return byConstraint;
  }
  const byElement = compareOrdinal(left.element, right.element);
  return byElement === 0
    ? compareOrdinal(left.propertyPath, right.propertyPath)
    : byElement;
}

export function indexItemsByParentId(
  items: readonly TInventoryItem[]
): ReadonlyMap<number, readonly TInventoryItem[]> {
  const byParentId = new Map<number, TInventoryItem[]>();
  for (const item of items) {
    if (item.parentId === null) {
      continue;
    }

    const siblings = byParentId.get(item.parentId);
    if (siblings === undefined) {
      byParentId.set(item.parentId, [item]);
    } else {
      siblings.push(item);
    }
  }
  return byParentId;
}
