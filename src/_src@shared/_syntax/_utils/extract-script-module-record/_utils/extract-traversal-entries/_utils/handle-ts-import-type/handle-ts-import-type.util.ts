import type { TModuleImport } from '../../../../../../_types/module-record.type.js';
import type { TSourceLocator } from '../../../../extract-script-module-record.type.js';
import type { TAstNode } from '../../extract-traversal-entries.type.js';

import { isRecord } from '../is-record/index.js';

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
    isRecord(source) && typeof source['value'] === 'string'
      ? source['value']
      : '';
  inlineImports.push({
    isTypeOnly: true,
    kind: 'typescript-import-type',
    position,
    specifier,
  });
}
