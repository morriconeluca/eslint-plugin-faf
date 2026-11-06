import type { TUnverifiedOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import { createOutcome } from '../../../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export function collectRecordUnverifiedOutcomes(
  relativePath: string,
  record: TModuleRecord,
  resolutions: readonly TImportResolution[]
): readonly TUnverifiedOutcome[] {
  const unresolvedImportOutcome = (
    reason: string,
    importItem: TModuleImport | undefined
  ): TUnverifiedOutcome => {
    const isNonLiteral = importItem?.kind === 'non-literal-dynamic-import';
    const position = importItem?.position;
    return isNonLiteral
      ? createOutcome('unverified/non-literal-dynamic-import', {
          element: relativePath,
          ...(position !== undefined && { position }),
          reason,
        })
      : createOutcome('unverified/unresolved-import', {
          detail: reason,
          element: relativePath,
          ...(position !== undefined && { position }),
          reason,
        });
  };

  const unsupportedSyntaxOutcome = (
    syntax: TUnsupportedSyntax
  ): TUnverifiedOutcome =>
    createOutcome('unverified/unsupported-syntax', {
      detail: syntax.description,
      element: relativePath,
      position: syntax.position,
      reason: syntax.description,
    });

  const outcomes: TUnverifiedOutcome[] = [];
  for (const resolution of resolutions) {
    if (resolution.target.type !== 'unresolved') {
      continue;
    }
    outcomes.push(
      unresolvedImportOutcome(
        resolution.target.reason,
        record.imports[resolution.importIndex]
      )
    );
  }
  for (const syntax of record.unsupportedSyntaxes) {
    outcomes.push(unsupportedSyntaxOutcome(syntax));
  }
  return outcomes;
}
