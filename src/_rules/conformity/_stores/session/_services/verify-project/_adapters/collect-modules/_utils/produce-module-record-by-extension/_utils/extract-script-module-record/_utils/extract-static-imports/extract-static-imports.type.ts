import type { TModuleImport } from '../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../_extract-script-module-record@shared/_types/imported-binding.type.js';

/**
 * Result of extracting static import declarations and their recorded bindings.
 */
export type TStaticImportsResult = {
  /**
   * Map of locally bound identifiers to their imported source specifications.
   */
  readonly bindingMap: ReadonlyMap<string, TImportedBinding>;

  /**
   * List of static import occurrences discovered in the AST.
   */
  readonly staticImports: readonly TModuleImport[];
};
