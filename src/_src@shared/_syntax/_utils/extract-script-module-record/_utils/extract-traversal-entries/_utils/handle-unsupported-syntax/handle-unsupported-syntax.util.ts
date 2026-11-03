import type { TUnsupportedSyntax } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

export function handleUnsupportedSyntax(
  node: TAstNode,
  locator: TSourceLocator,
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  const start = typeof node['start'] === 'number' ? node['start'] : 0;
  if (node.type === 'TSExportAssignment') {
    unsupportedSyntaxes.push({
      description: 'TypeScript export assignment (export =) is unsupported',
      position: locator(start),
    });
    return;
  }

  if (
    node.type === 'TSModuleDeclaration' &&
    (node['kind'] === 'module' || node['kind'] === 'global')
  ) {
    unsupportedSyntaxes.push({
      description:
        'Ambient module or global augmentation (declare module / declare global) is unsupported',
      position: locator(start),
    });
  }
}
