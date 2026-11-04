import type { TModuleImport } from '../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

/**
 * Result of extracting a TypeScript import equals declaration.
 */
export type TExtractedImportEquals = {
  /**
   * Imported binding recorded for re-export resolution.
   */
  readonly binding: TImportedBinding;

  /**
   * Static module import entry created from the external module reference.
   */
  readonly staticImport: TModuleImport;
};
