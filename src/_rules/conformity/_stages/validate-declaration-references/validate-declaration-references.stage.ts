import type { TFAFConfig } from '../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TEffectiveDeclarations,
  TInventory,
} from '../../_conformity@shared/_types/verification-model.type.js';

import { createReferenceContext } from './_utils/create-reference-context/index.js';
import { sortConfigOutcomes } from './_utils/sort-config-outcomes/index.js';
import { validateAliasReferences } from './_utils/validate-alias-references/index.js';
import { validateForeignReferences } from './_utils/validate-foreign-references/index.js';
import { validateFrontierReferences } from './_utils/validate-frontier-references/index.js';
import { validateLocalRootFragments } from './_utils/validate-local-root-fragments/index.js';
import { validateStructuralReferences } from './_utils/validate-structural-references/index.js';

export function validateDeclarationReferences(
  config: TFAFConfig,
  declarations: TEffectiveDeclarations,
  inventory: TInventory
): readonly TConfigOutcome[] {
  const context = createReferenceContext(config, declarations, inventory);
  return sortConfigOutcomes([
    ...validateLocalRootFragments(config, context),
    ...validateForeignReferences(config, context),
    ...validateStructuralReferences(config, context),
    ...validateFrontierReferences(config, context),
    ...validateAliasReferences(config, context),
  ]);
}
