import type { TOriginKind } from '../../../../_types/declarations.type.js';

/**
 * Descriptor of an apical tree origin extracted from configuration.
 */
export type TOriginEntry = {
  /**
   * Kind of the origin: root layer or root fragment.
   */
  readonly kind: TOriginKind;

  /**
   * Posix path of the origin relative to configuration root.
   */
  readonly path: string;

  /**
   * Object access path locating this origin declaration within configuration.
   */
  readonly propertyPath: string;
};
