import type {
  TClassificationOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TItemClassification } from '../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../_verify-project@shared/_types/_primitives/declarations.type.js';
import type { TInventoryItem } from '../../_verify-project@shared/_types/_primitives/inventory.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';
import type { TParentDomainType } from './_containment-matrix@shared/_types/containment-matrix.type.js';

import { createOutcome } from '../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { CONTAINMENT_MATRIX } from './_configs/containment-matrix.config.js';
import { resolveChildType } from './_utils/resolve-child-type/index.js';

export function verifyContainmentMatrix(
  model: TVerificationModel
): readonly TOutcome[] {
  const mimeticParentPaths = new Set<string>();
  const recordMimeticPath = (path: string, tree: TEffectiveTree): void => {
    const categoryName = path.split('/').at(-1) ?? '';
    const role = tree.catalog.categoryToRole.get(categoryName);
    if (role !== undefined && role.form === 'fragments') {
      mimeticParentPaths.add(path);
    }
  };

  for (const tree of model.basis.declarations.trees) {
    for (const structure of tree.mimeticPathStructures) {
      for (const path of structure.paths) {
        recordMimeticPath(path, tree);
      }
    }
  }

  const resolveParentType = (
    parent: TItemClassification
  ): null | TParentDomainType => {
    const { domainKind } = parent;
    if (domainKind === 'path-sub-category') {
      return 'mimetic-parent-category';
    }
    if (domainKind === 'category') {
      return mimeticParentPaths.has(parent.path)
        ? 'mimetic-parent-category'
        : 'category';
    }
    if (domainKind === 'sub-category') {
      return 'category';
    }
    return domainKind;
  };

  const verifyItem = (item: TInventoryItem): null | TClassificationOutcome => {
    if (item.parentId === null) {
      return null;
    }
    const childClassification = model.taxonomy.byItemId.get(item.id);
    const parentClassification = model.taxonomy.byItemId.get(item.parentId);
    if (
      childClassification === undefined ||
      parentClassification === undefined
    ) {
      return null;
    }
    const parentType = resolveParentType(parentClassification);
    if (parentType === null) {
      return null;
    }
    const childType = resolveChildType(childClassification, parentType);
    if (childType === null) {
      return null;
    }
    const admittedChildren = CONTAINMENT_MATRIX[parentType];
    if (admittedChildren.includes(childType)) {
      return null;
    }
    return createOutcome('classification/containment-matrix', {
      element: item.path,
    });
  };

  const outcomes: TClassificationOutcome[] = [];
  for (const item of model.basis.inventory.items) {
    const outcome = verifyItem(item);
    if (outcome !== null) {
      outcomes.push(outcome);
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));

  return outcomes;
}
