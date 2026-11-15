import type { TFAFMimeticPathStructure } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

import { createOutcome } from '../../../../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { referenceScope } from '../../../../../../_validate-config-references@shared/_utils/reference-scope/index.js';

export function rejectMimeticStructures(
  structures: readonly TFAFMimeticPathStructure[],
  basePath: string,
  scope: TScopeBinding,
  context: TReferenceContext
): readonly TConfigOutcome[] {
  const seen = new Set<string>();
  const outcomes: TConfigOutcome[] = [];
  for (const [structIndex, structure] of structures.entries()) {
    for (const [pathIndex, path] of structure.paths.entries()) {
      const propertyPath = `${basePath}[${structIndex}].paths[${pathIndex}]`;
      if (seen.has(path)) {
        outcomes.push(
          createOutcome('configuration/duplicate-mimetic-path', {
            element: path,
            propertyPath,
          })
        );
      } else {
        seen.add(path);
      }
      outcomes.push(
        ...referenceScope.rejectDirectoryInScope({
          context,
          label: 'Mimetic path',
          path,
          propertyPath,
          scope,
        })
      );
    }
  }
  return outcomes;
}
