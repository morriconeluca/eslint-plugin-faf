import type { TImportSyntaxKind } from '../../_conformity@shared/_types/verification-model.type.js';

export const RE_EXPORT_IMPORT_KINDS: ReadonlySet<TImportSyntaxKind> = new Set([
  'export-all-from',
  'export-named-from',
  'export-type-from',
]);
