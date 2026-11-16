import type { TResult } from '../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TBuildInventoryInput,
  TBuildInventoryValue,
} from './build-inventory.type.js';

import { includeExternalTargets } from './_utils/include-external-targets/index.js';
import { listEntries } from './_utils/list-entries/index.js';
import { assembleInventory } from './build-inventory.util.js';

export function buildInventory(
  input: TBuildInventoryInput
): TResult<TBuildInventoryValue> {
  const entries = listEntries(input.baseDirectory, input.origins);
  if (!entries.ok) {
    return { ok: false, outcomes: entries.outcomes };
  }
  const built = assembleInventory(entries.value, input.origins);
  const inventory = includeExternalTargets(
    built.inventory,
    input.config,
    input.baseDirectory,
    input.origins
  );
  return {
    ok: true,
    value: {
      inventory,
      inventoryOutcomes: built.outcomes,
    },
  };
}
