/**
 * Single validation scope pairing horizontal hierarchy models with an effective Category catalog.
 */
export type THierarchyModelCheckScope = {
  /**
   * Configuration property path locating the horizontalHierarchyModels array.
   */
  readonly basePropertyPath: string;

  /**
   * Declared Category names from the effective role catalog.
   */
  readonly categoryNames: ReadonlySet<string>;

  /**
   * Raw horizontalHierarchyModels value to inspect for Category name conflicts.
   */
  readonly models: unknown;
};
