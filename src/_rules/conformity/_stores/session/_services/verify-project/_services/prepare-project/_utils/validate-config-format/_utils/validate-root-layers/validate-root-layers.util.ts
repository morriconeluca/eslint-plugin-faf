import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/translate-config-issues/index.js';
import { rootLayersSchema } from './_schemas/root-layers-schema/index.js';

export function validateRootLayers(
  rootLayers: unknown,
  basePath: string
): readonly TConfigOutcome[] {
  if (rootLayers === undefined) {
    return [];
  }
  const parsed = rootLayersSchema.safeParse(rootLayers);
  const outcomes = parsed.success
    ? []
    : translateConfigIssues(
        parsed.error.issues,
        rootLayers,
        `${basePath}.rootLayers`
      );
  if (!Array.isArray(rootLayers)) {
    return outcomes;
  }
  const seen = new Set<string>();
  const duplicates: TConfigOutcome[] = [];
  for (const [index, item] of rootLayers.entries()) {
    if (typeof item !== 'string' || item.length === 0) {
      continue;
    }
    if (seen.has(item)) {
      duplicates.push(
        createOutcome('configuration/duplicate-element', {
          propertyPath: `${basePath}.rootLayers[${index}]`,
        })
      );
    } else {
      seen.add(item);
    }
  }
  return [...outcomes, ...duplicates];
}
