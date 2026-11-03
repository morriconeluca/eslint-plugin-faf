import type { TImportResolution } from '../../_graph/_types/dependency-graph.type.js';
import type { TModuleImport } from '../../_syntax/_types/module-record.type.js';

/**
 * Synchronous function that resolves the imports of one source file.
 */
export type TSpecifierResolver = (
  sourcePath: string,
  imports: readonly TModuleImport[]
) => readonly TImportResolution[];
