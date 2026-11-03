import type { TEffectiveDeclarations } from '../../../_declarations/_types/declarations.type.js';
import type { TFAFConfig } from '../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../_domain/_types/outcome.type.js';
import type { TInventory } from '../../../_inventory/_types/inventory.type.js';

import { validateForeignReferences } from './_utils/validate-foreign-references/index.js';
import { validateFrontierReferences } from './_utils/validate-frontier-references/index.js';
import { validateRootReferences } from './_utils/validate-root-references/index.js';
import { validateStructuralReferences } from './_utils/validate-structural-references/index.js';
import { createReferenceContext } from './_validate-config-references@shared/_utils/create-reference-context/index.js';
import { sortConfigOutcomes } from './_validate-config-references@shared/_utils/sort-config-outcomes/index.js';

export function validateConfigReferences(
  config: TFAFConfig,
  declarations: TEffectiveDeclarations,
  inventory: TInventory
): readonly TConfigOutcome[] {
  const context = createReferenceContext(config, declarations, inventory);
  return sortConfigOutcomes([
    ...validateRootReferences(config, context),
    ...validateForeignReferences(config, context),
    ...validateStructuralReferences(config, context),
    ...validateFrontierReferences(config, context),
  ]);
}
