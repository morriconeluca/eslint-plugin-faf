import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type { TTreeClassificationContext } from '../../_classify-taxonomy@shared/_types/classify-taxonomy.type.js';

/**
 * Declaration indexes and configuration outcomes prepared before a tree walk.
 */
export type TTreeBuild = {
  /**
   * Classification facts for one fractal tree.
   */
  readonly context: TTreeClassificationContext;

  /**
   * Property path of each unique mimetic Parent Category declaration.
   */
  readonly mimeticPropertyPaths: ReadonlyMap<string, string>;

  /**
   * Configuration outcomes discovered while indexing declarations.
   */
  readonly outcomes: readonly TConfigOutcome[];

  /**
   * Property path of each declared Root Fragment.
   */
  readonly rootFragmentPropertyPaths: ReadonlyMap<string, string>;

  /**
   * Property path of each enumerated Root Node.
   */
  readonly rootNodePropertyPaths: ReadonlyMap<string, string>;
};
