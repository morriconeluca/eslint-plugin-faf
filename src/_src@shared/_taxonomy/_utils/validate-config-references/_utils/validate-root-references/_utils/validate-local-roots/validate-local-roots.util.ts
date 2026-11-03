import type { TFAFLocalConfig } from '../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../_domain/_types/outcome.type.js';
import type { TReferenceContext } from '../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { CONFIG_5 } from '../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
import { rejectOriginDirectory } from '../../../../_validate-config-references@shared/_utils/reject-origin-directory/index.js';
import { validateRootFragmentTree } from './_utils/validate-root-fragment-tree/index.js';

export function validateLocalRoots(
  local: TFAFLocalConfig,
  localIndex: number,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const layers = local.rootLayers ?? [];
  const layerOutcomes = layers.flatMap((path, layerIndex) =>
    rejectOriginDirectory({
      context,
      label: 'Origin directory',
      normativeReference: CONFIG_5,
      path,
      propertyPath: `faf.locals[${localIndex}].rootLayers[${layerIndex}]`,
    })
  );
  const fragments = local.rootFragments ?? [];
  const fragmentOutcomes = fragments.flatMap((fragment, fragmentIndex) =>
    validateRootFragmentTree(
      fragment,
      null,
      fragment.path,
      localIndex,
      `faf.locals[${localIndex}].rootFragments[${fragmentIndex}]`,
      context
    )
  );
  return [...layerOutcomes, ...fragmentOutcomes];
}
