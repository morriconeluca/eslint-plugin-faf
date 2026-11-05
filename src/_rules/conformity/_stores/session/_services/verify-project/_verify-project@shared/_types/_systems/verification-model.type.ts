import type { TModuleCollection } from '../_aggregates/module-collection.type.js';
import type { TProjectBasis } from '../_aggregates/project-basis.type.js';
import type { TTaxonomyModel } from '../_compounds/classification.type.js';
import type { TDependencyGraph } from '../_compounds/dependency-graph.type.js';
import type { THorizontalHierarchies } from '../_compounds/horizontal-hierarchies.type.js';
import type { TPublicSurface } from '../_compounds/public-surface.type.js';

/**
 * Project model passed to every norm. Stages fill it; norms do not depend on each other.
 */
export type TVerificationModel = {
  /**
   * Ready preparation of configuration, inventory, and acquired aliases.
   */
  readonly basis: TProjectBasis;

  /**
   * Resolved dependency graph of the codebase.
   */
  readonly graph: TDependencyGraph;

  /**
   * Ranks of admitted sibling sets.
   */
  readonly hierarchies: THorizontalHierarchies;

  /**
   * Collected Module Records, resolutions, and unverified outcomes.
   */
  readonly modules: TModuleCollection;

  /**
   * Logical Nodes exposed by each Fractal Tree.
   */
  readonly surface: TPublicSurface;

  /**
   * Classification of every inventory item.
   */
  readonly taxonomy: TTaxonomyModel;
};
