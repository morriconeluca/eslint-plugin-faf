import type { TUnverifiedOutcome } from '../../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

import {
  ANALYSIS_NORMATIVE_REFERENCE,
  NON_LITERAL_DYNAMIC_IMPORT_CONSTRAINT,
  RESOLUTION_NORMATIVE_REFERENCE,
  UNRESOLVED_IMPORT_CONSTRAINT,
  UNSUPPORTED_SYNTAX_CONSTRAINT,
  UNVERIFIED_FAMILY,
} from '../../_analyze-module-source@shared/_constants/collect-modules.constant.js';

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
    const outcome: TUnverifiedOutcome = {
      constraint: isNonLiteral
        ? NON_LITERAL_DYNAMIC_IMPORT_CONSTRAINT
        : UNRESOLVED_IMPORT_CONSTRAINT,
      element: relativePath,
      family: UNVERIFIED_FAMILY,
      message: isNonLiteral
        ? `Non-literal dynamic import in '${relativePath}' cannot be resolved statically.`
        : `Import in '${relativePath}' could not be resolved: ${reason}`,
      normativeReference: isNonLiteral
        ? ANALYSIS_NORMATIVE_REFERENCE
        : RESOLUTION_NORMATIVE_REFERENCE,
      reason,
    };
    if (importItem === undefined) {
      return outcome;
    }
    return {
      ...outcome,
      position: importItem.position,
    };
  };

  const unsupportedSyntaxOutcome = (
    syntax: TUnsupportedSyntax
  ): TUnverifiedOutcome => ({
    constraint: UNSUPPORTED_SYNTAX_CONSTRAINT,
    element: relativePath,
    family: UNVERIFIED_FAMILY,
    message: `Unsupported syntax in '${relativePath}': ${syntax.description}`,
    normativeReference: ANALYSIS_NORMATIVE_REFERENCE,
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
