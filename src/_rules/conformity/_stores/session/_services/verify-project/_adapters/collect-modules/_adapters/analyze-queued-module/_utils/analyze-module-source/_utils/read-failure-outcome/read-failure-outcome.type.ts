import type { TModuleReadFailureKind } from '../../../../../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

/**
 * Read failure used to build an unverified outcome for one module path.
 */
export type TReadFailureInput = {
  /**
   * Whether the path is a file node of an inventoried Fractal Tree.
   */
  readonly isTreeFile: boolean;

  /**
   * Discriminant of the filesystem or decoding failure.
   */
  readonly kind: TModuleReadFailureKind;

  /**
   * Technical reason carried into the unverified outcome.
   */
  readonly reason: string;

  /**
   * POSIX path relative to the base identifying the affected file.
   */
  readonly relativePath: string;
};
