import type { TEffectiveTree } from '../../../../../../../_declarations/_types/declarations.type.js';
import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type { TItemClassification } from '../../../../../../_types/classification.type.js';

import {
  CONFIGURATION_FAMILY,
  CONSTRAINT_INCOMPATIBLE_MIMETIC_DESIGNATION,
  DOMAIN_CATEGORY,
  FORM_FRAGMENTS,
  NORMATIVE_SECTION_6_3_5,
} from '../../../../_classify-taxonomy@shared/_constants/classification-constraints.constant.js';
import { readPathName } from '../../../../_classify-taxonomy@shared/_utils/read-path-name/index.js';

export function verifyMimeticPaths(
  byPath: ReadonlyMap<string, TItemClassification>,
  tree: TEffectiveTree,
  mimeticPropertyPaths: ReadonlyMap<string, string>
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  for (const [mimeticPath, propertyPath] of mimeticPropertyPaths) {
    const classification = byPath.get(mimeticPath);
    if (classification === undefined) {
      continue;
    }
    const role = tree.catalog.categoryToRole.get(readPathName(mimeticPath));
    const isValidParent =
      classification.domainKind === DOMAIN_CATEGORY &&
      role?.form === FORM_FRAGMENTS;
    if (!isValidParent) {
      outcomes.push({
        constraint: CONSTRAINT_INCOMPATIBLE_MIMETIC_DESIGNATION,
        element: mimeticPath,
        family: CONFIGURATION_FAMILY,
        message: `Mimetic path '${mimeticPath}' does not identify a Category of Fragments.`,
        normativeReference: NORMATIVE_SECTION_6_3_5,
        propertyPath,
      });
    }
  }
  return outcomes;
}
