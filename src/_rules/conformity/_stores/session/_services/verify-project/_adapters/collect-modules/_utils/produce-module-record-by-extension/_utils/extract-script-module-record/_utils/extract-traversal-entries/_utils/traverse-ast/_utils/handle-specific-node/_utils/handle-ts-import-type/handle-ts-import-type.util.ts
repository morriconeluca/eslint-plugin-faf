import type { TModuleImport } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TSourceLocator } from '../../../../../../../../_extract-script-module-record@shared/_utils/create-source-locator/index.js';
import type { TAstNode } from '../../../../../../_extract-traversal-entries@shared/_types/traversal-entries.type.js';

import { isAstNode } from '../../../../_traverse-ast@shared/_utils/is-ast-node/index.js';

export function handleTsImportType(
  importType: TAstNode,
  locator: TSourceLocator,
  inlineImports: TModuleImport[]
): void {
  const start =
    typeof importType['start'] === 'number' ? importType['start'] : 0;
  const position = locator(start);
  const source = importType['source'];
  const specifier =
    isAstNode(source) && typeof source['value'] === 'string'
      ? source['value']
      : '';
  inlineImports.push({
    isTypeOnly: true,
    kind: 'typescript-import-type',
    position,
    specifier,
  });
}
