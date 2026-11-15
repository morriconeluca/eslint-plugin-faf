import type { ExportSpecifier } from 'oxc-parser';

export function getExportedName(node: ExportSpecifier['exported']): string {
  return node.type === 'Literal' ? node.value : node.name;
}
