import type { TImportSyntaxKind } from '../../../../../../_session@shared/_types/module-record.type.js';

export const RE_EXPORT_IMPORT_KINDS: ReadonlySet<TImportSyntaxKind> = new Set([
  'export-all-from',
  'export-named-from',
  'export-type-from',
]);
