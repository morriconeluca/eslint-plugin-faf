import type { TFAFConfig } from '../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TReferenceContext } from '../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function validateAliasReferences(
  config: TFAFConfig,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const outcomes: TConfigOutcome[] = [];
  const entries = Object.entries(config.faf.common?.aliases ?? {});
  for (const [key, basePath] of entries) {
    const id = context.inventory.pathToId.get(basePath);
    if (id === undefined) {
      outcomes.push(
        createOutcome('configuration/non-existent-path', {
          detail: `Alias base "${basePath}" does not exist under configuration base "${context.baseDirectory}".`,
          element: basePath,
          propertyPath: `faf.common.aliases.${key}`,
        })
      );
      continue;
    }
    const item = context.inventory.items[id];
    if (item === undefined || item.kind !== 'directory') {
      outcomes.push(
        createOutcome('configuration/expected-directory', {
          detail: `Alias base "${basePath}" must be a directory.`,
          element: basePath,
          propertyPath: `faf.common.aliases.${key}`,
        })
      );
    }
  }
  return outcomes;
}
