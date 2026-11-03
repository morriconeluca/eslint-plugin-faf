import type {
  TImportResolution,
  TResolvedTarget,
} from '../../../_graph/_types/dependency-graph.type.js';
import type { TModuleImport } from '../../../_syntax/_types/module-record.type.js';

/**
 * Memoized resolution result caching target and matched alias metadata.
 */
export type TCachedResolution = {
  /**
   * Evaluated candidate target paths corresponding to the matched alias prefix.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Prefix of the path alias applied to the specifier, or null if direct.
   */
  readonly aliasUsed: null | string;

  /**
   * Target outcome resolved by the underlying oxc-resolver instance.
   */
  readonly target: TResolvedTarget;
};

/**
 * Synchronous resolver function mapping import references within a file to their concrete resolutions.
 */
export type TSpecifierResolver = (
  sourcePath: string,
  imports: readonly TModuleImport[]
) => readonly TImportResolution[];
