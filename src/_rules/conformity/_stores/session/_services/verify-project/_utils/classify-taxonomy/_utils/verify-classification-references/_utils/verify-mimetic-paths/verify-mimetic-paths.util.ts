import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TItemClassification } from '../../../../../../_verify-project@shared/_types/_compounds/classification.type.js';
import type { TEffectiveTree } from '../../../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import {
  DOMAIN_CATEGORY,
  FORM_FRAGMENTS,
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
      outcomes.push(
        createOutcome('configuration/incompatible-mimetic-designation', {
          element: mimeticPath,
          propertyPath,
        })
      );
    }
  }
  return outcomes;
}
