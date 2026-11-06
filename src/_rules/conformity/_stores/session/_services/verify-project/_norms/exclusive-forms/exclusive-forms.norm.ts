import type {
  TClassificationOutcome,
  TOutcome,
} from '../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TVerificationModel } from '../../_verify-project@shared/_types/_systems/verification-model.type.js';

import { createOutcome } from '../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { compareOrdinal } from '../../_verify-project@shared/_utils/compare-ordinal/index.js';
import { groupChildrenByParentId } from './_utils/group-children-by-parent-id/index.js';
import { hasStratifiedConflict } from './_utils/has-stratified-conflict/index.js';
import { hasTaxonomicConflict } from './_utils/has-taxonomic-conflict/index.js';

export function verifyExclusiveForms(
  model: TVerificationModel
): readonly TOutcome[] {
  const mimeticPaths = new Set(
    model.basis.declarations.trees.flatMap((tree) =>
      tree.mimeticPathStructures.flatMap((structure) => structure.paths)
    )
  );
  const stratifiedDomains = new Set<null | string | undefined>([
    'fractal-branch',
    'layer',
    'root-layer',
  ]);
  const taxonomicDomains = new Set<null | string | undefined>([
    'category',
    'sub-category',
  ]);
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

    const isStratified = stratifiedDomains.has(domainKind);
    const isTaxonomic =
      taxonomicDomains.has(domainKind) && !mimeticPaths.has(item.path);

    const hasConflict = isStratified
      ? hasStratifiedConflict(children, model.taxonomy)
      : isTaxonomic && hasTaxonomicConflict(children, model.taxonomy);

    if (hasConflict) {
      outcomes.push(
        createOutcome('classification/exclusive-forms', {
          element: item.path,
        })
      );
    }
  }

  outcomes.sort((left, right) => compareOrdinal(left.element, right.element));
  return outcomes;
}
