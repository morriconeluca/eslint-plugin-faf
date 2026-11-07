import type { TUnsupportedSyntax } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

export function handleUnsupportedSyntax(
  node: TAstNode,
  locator: TSourceLocator,
  unsupportedSyntaxes: TUnsupportedSyntax[]
): void {
  if (node.type !== 'TSExportAssignment') {
    return;
  }

  const start = typeof node['start'] === 'number' ? node['start'] : 0;
  unsupportedSyntaxes.push({
    description: 'TypeScript export assignment (export =) is unsupported',
    position: locator(start),
  });
}
