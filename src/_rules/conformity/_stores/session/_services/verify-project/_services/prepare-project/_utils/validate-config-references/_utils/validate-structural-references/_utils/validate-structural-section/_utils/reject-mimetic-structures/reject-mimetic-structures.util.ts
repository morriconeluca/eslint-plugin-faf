import type { TFAFMimeticPathStructure } from '../../../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import { createOutcome } from '../../../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';
import { rejectDirectoryInScope } from '../../../../../../_validate-config-references@shared/_utils/reject-directory-in-scope/index.js';

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
        ...rejectDirectoryInScope({
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
