import type {
  TClassificationOutcome,
  TOutcome,
} from '../../../../_src@shared/_utils/create-outcome/index.js';
import type { TVerificationModel } from '../../_conformity@shared/_types/verification-model.type.js';

import { createOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_conformity@shared/_utils/compare-ordinal/index.js';
import {
  groupChildrenByParentId,
  hasCategoryContentConflict,
  hasLayerCategoryConflict,
} from './exclusive-forms.util.js';

export function verifyExclusiveForms(
  model: TVerificationModel
): readonly TOutcome[] {
  const layerOrBranchDomains = new Set<null | string | undefined>([
    'fractal-branch',
    'layer',
    'root-layer',
  ]);
  const categoryOrSubCategoryDomains = new Set<null | string | undefined>([
    'category',
    'sub-category',
  ]);
  const mimeticPaths = new Set(
    model.basis.declarations.trees.flatMap((tree) =>
      tree.mimeticPathStructures.flatMap((structure) => structure.paths)
    )
  );
  const childrenByParentId = groupChildrenByParentId(
    model.basis.inventory.items
  );
  const outcomes: TClassificationOutcome[] = [];

  for (const item of model.basis.inventory.items) {
    const children = childrenByParentId.get(item.id);
    if (children === undefined) {
      continue;
    }

    const classification = model.taxonomy.byItemId.get(item.id);
    const domainKind = classification?.domainKind;

    const isLayerOrBranchContainer = layerOrBranchDomains.has(domainKind);
    const isCategoryContainer =
      categoryOrSubCategoryDomains.has(domainKind) &&
      !mimeticPaths.has(item.path);

    const hasConflict = isLayerOrBranchContainer
      ? hasLayerCategoryConflict(children, model.taxonomy)
      : isCategoryContainer &&
        hasCategoryContentConflict(children, model.taxonomy);

    if (hasConflict) {
      outcomes.push(
        createOutcome.classification('classification/exclusive-forms', {
          element: item.path,
        })
      );
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
