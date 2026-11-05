import type { TModuleImport } from '../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportResolution } from '../../../../../_verify-project@shared/_types/_compounds/dependency-graph.type.js';

/**
 * Synchronous function that resolves the imports of one source file.
 */
export type TSpecifierResolver = (
  sourcePath: string,
  imports: readonly TModuleImport[]
) => readonly TImportResolution[];
