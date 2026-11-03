import type { TEffectiveTree } from '../../../_declarations/_types/declarations.type.js';
import type { TConfigOutcome } from '../../../_domain/_types/outcome.type.js';
import type {
  TInventory,
  TInventoryItem,
} from '../../../_inventory/_types/inventory.type.js';
import type { TItemClassification } from '../../_types/classification.type.js';
import type {
  TClassificationDraft,
  TClassifyTaxonomyInput,
  TDirectoryParent,
  TTaxonomyClassification,
} from './_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

import {
  ABSENT_ROLE,
  CONFIGURATION_FAMILY,
  CONSTRAINT_CONTRADICTORY_ROOT_FOREIGN,
  CONSTRAINT_UNDECLARED_SUB_ROOT_FRAGMENT,
  CONSTRAINT_UNENUMERATED_ROOT_FILE,
  DOMAIN_FRAGMENT,
  NORMATIVE_SECTION_6_2,
  UNDERSCORE,
} from './_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { compareConfigOutcomes } from './_classify-taxonomy@shared/_utils/compare-config-outcomes/index.js';
import { readPathName } from './_classify-taxonomy@shared/_utils/read-path-name/index.js';
import { buildTreeContext } from './_utils/build-tree-context/index.js';
import { classifyDirectory } from './_utils/classify-directory/index.js';
import { classifyFile } from './_utils/classify-file/index.js';
import { finalizeClassifications } from './_utils/finalize-classifications/index.js';
import { selectForeignNodes } from './_utils/select-foreign-nodes/index.js';
import { verifyClassificationReferences } from './_utils/verify-classification-references/index.js';

export function classifyTaxonomy(
  input: TClassifyTaxonomyInput
): TTaxonomyClassification {
  const classifications: TItemClassification[] = [];
  const outcomes: TConfigOutcome[] = [];

  const classifyOneTree = (
    inventory: TInventory,
    tree: TEffectiveTree,
    treeIndex: number
  ): void => {
    const originId = inventory.pathToId.get(tree.originPath);
    if (originId === undefined) {
      return;
    }
    const originItem = inventory.items[originId];
    if (originItem === undefined || originItem.kind !== 'directory') {
      return;
    }
    const selection = selectForeignNodes(inventory, tree);
    const treeBuild = buildTreeContext(
      tree,
      treeIndex,
      input.getRoleFromName,
      selection
    );
    outcomes.push(...treeBuild.outcomes);
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

    const childrenOf = (parentId: number): readonly TInventoryItem[] =>
      inventory.items.filter((item) => item.parentId === parentId);

    const recordFile = (
      child: TInventoryItem,
      parent: TDirectoryParent
    ): void => {
      const classified = classifyFile(child.path, parent, treeBuild.context);
      if (classified.conflict !== null) {
        const isContradictory =
          classified.conflict === 'contradictory-root-foreign';
        outcomes.push({
          constraint: isContradictory
            ? CONSTRAINT_CONTRADICTORY_ROOT_FOREIGN
            : CONSTRAINT_UNENUMERATED_ROOT_FILE,
          element: child.path,
          family: CONFIGURATION_FAMILY,
          message: isContradictory
            ? `Root Node '${child.path}' is also designated as a Foreign Node.`
            : `Direct file '${child.path}' of a Root Fragment is neither enumerated nor designated Foreign.`,
          normativeReference: NORMATIVE_SECTION_6_2,
          propertyPath: isContradictory
            ? (treeBuild.rootNodePropertyPaths.get(child.path) ??
              `trees[${treeIndex}].rootFragments`)
            : (treeBuild.rootFragmentPropertyPaths.get(parent.path) ??
              `trees[${treeIndex}].rootFragments`),
        });
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
      outcomes.push({
        constraint: CONSTRAINT_UNDECLARED_SUB_ROOT_FRAGMENT,
        element: child.path,
        family: CONFIGURATION_FAMILY,
        message: `Frontier directory '${child.path}' is not declared in subRootFragments.`,
        normativeReference: NORMATIVE_SECTION_6_2,
        propertyPath,
      });
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
      for (const child of childrenOf(item.id)) {
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
    classifications.push(...finalized);
    outcomes.push(
      ...verifyClassificationReferences(finalized, tree, treeIndex, treeBuild)
    );
  };

  for (const [treeIndex, tree] of input.declarations.trees.entries()) {
    classifyOneTree(input.inventory, tree, treeIndex);
  }

  outcomes.sort(compareConfigOutcomes);
  return {
    model: {
      byItemId: new Map(
        classifications.map((classification) => [
          classification.itemId,
          classification,
        ])
      ),
      byPath: new Map(
        classifications.map((classification) => [
          classification.path,
          classification,
        ])
      ),
      classifications,
    },
    outcomes,
  };
}
