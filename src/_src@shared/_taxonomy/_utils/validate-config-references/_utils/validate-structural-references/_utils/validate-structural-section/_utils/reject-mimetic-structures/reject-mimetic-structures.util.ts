import type { TFAFMimeticPathStructure } from '../../../../../../../../../_domain/_types/faf-config.type.js';
import type { TConfigOutcome } from '../../../../../../../../../_domain/_types/outcome.type.js';
import type {
  TReferenceContext,
  TScopeBinding,
} from '../../../../../../_validate-config-references@shared/_types/reference-context.type.js';

import {
  CONFIG_8,
  CONSTRAINT_DUPLICATE_MIMETIC_PATH,
} from '../../../../../../_validate-config-references@shared/_constants/reference-constraints.constant.js';
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
        outcomes.push({
          constraint: CONSTRAINT_DUPLICATE_MIMETIC_PATH,
          element: path,
          family: 'configuration',
          message: `Mimetic path "${path}" is declared in multiple mimetic path structures.`,
          normativeReference: CONFIG_8,
          propertyPath,
        });
      } else {
        seen.add(path);
      }
      outcomes.push(
        ...rejectDirectoryInScope({
          context,
          label: 'Mimetic path',
          normativeReference: CONFIG_8,
          path,
          propertyPath,
          scope,
        })
      );
    }
  }
  return outcomes;
}
