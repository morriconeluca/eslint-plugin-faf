import type {
  TAbsentDiagnostic,
  TFixedDiagnostic,
} from '../../../../_types/config-diagnostic.type.js';

export function chooseAbsentDiagnostic(
  diagnostic: TAbsentDiagnostic,
  isEmptyArray: boolean,
  hasExplicitKey: boolean
): TFixedDiagnostic {
  if (isEmptyArray && diagnostic.emptyList !== null) {
    return diagnostic.emptyList;
  }
  if (hasExplicitKey) {
    return diagnostic.explicit;
  }
  return diagnostic.missing;
}
