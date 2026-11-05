import type { TSourceLocation } from '../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Observed crossing from a source tree node through external local files to a destination tree node.
 */
export type TExternalCrossing = {
  /**
   * Complete sequence of relative POSIX file paths from source to destination.
   */
  readonly chain: readonly string[];

  /**
   * Relative POSIX path of the resolved destination tree node.
   */
  readonly destinationPath: string;

  /**
   * Zero-based index of the initial crossing import in the source module record.
   */
  readonly importIndex: number;

  /**
   * Source coordinates where the initial crossing import reference originated.
   */
  readonly position: TSourceLocation;

  /**
   * Relative POSIX path of the source tree node initiating the crossing.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source tree node for the initial crossing edge.
   */
  readonly specifier: string;
};
