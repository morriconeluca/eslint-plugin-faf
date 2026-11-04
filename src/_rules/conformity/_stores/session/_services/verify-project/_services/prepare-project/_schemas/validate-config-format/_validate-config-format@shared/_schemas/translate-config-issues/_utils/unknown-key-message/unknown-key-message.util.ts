import type { TKeyDiagnostic } from '../../../../_types/config-diagnostic.type.js';

export function unknownKeyMessage(
  style: TKeyDiagnostic['messageStyle'],
  key: string
): string {
  if (style === 'root') {
    return `Unknown property "${key}" is forbidden on root configuration object.`;
  }
  if (style === 'faf') {
    return `Unknown property "${key}" is forbidden on faf object.`;
  }
  if (style === 'sub-graph') {
    return `Unknown property "${key}" is forbidden on sub-graph role.`;
  }
  return `Unknown property "${key}" is forbidden.`;
}
