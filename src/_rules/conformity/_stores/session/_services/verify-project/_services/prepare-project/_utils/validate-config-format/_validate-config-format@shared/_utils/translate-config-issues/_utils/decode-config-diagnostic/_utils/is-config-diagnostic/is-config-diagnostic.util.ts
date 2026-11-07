import type { TConfigDiagnostic } from '../../../../../../_types/config-diagnostic.type.js';

export function isConfigDiagnostic(value: unknown): value is TConfigDiagnostic {
  const isObject = typeof value === 'object' && value !== null;
  const record = isObject && !Array.isArray(value) ? value : null;
  if (record === null || !('kind' in record)) {
    return false;
  }
  const kind = record.kind;
  const kinds = new Set(['absent', 'fixed', 'keys']);
  return typeof kind === 'string' && kinds.has(kind);
}
