import type { TFAFHierarchy } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';
import type {
  TEffectiveForeignNodes,
  TEffectiveLocalHierarchy,
  TEffectiveMimeticStructure,
  TEffectiveOrientedPair,
} from '../../../../_verify-project@shared/_types/_primitives/declarations.type.js';

/**
 * Filtered and composed tree-scoped declarations for a single fractal tree origin.
 */
export type TTreeScopedDeclarations = {
  /**
   * Authorized egress dependency pairs connecting internal nodes to external files.
   */
  readonly externalDependencyPairs: readonly TEffectiveOrientedPair[];

  /**
   * Folder locations designated as foreign domains within this tree.
   */
  readonly foreignDomains: readonly string[];

  /**
   * Discrete foreign files and pattern matching rules for non-architectural assets.
   */
  readonly foreignNodes: TEffectiveForeignNodes;

  /**
   * General descending rank tiers applied to matching sibling organizational folders.
   */
  readonly horizontalHierarchies: readonly TFAFHierarchy[];

  /**
   * Local hierarchy definitions bound to explicit folder locations in this tree.
   */
  readonly localHorizontalHierarchies: readonly TEffectiveLocalHierarchy[];

  /**
   * Designated organizational folders mirroring external HTTP or command structures.
   */
  readonly mimeticPathStructures: readonly TEffectiveMimeticStructure[];

  /**
   * Exposed entry files accessible to external consumers across tree boundaries.
   */
  readonly publicRootNodes: readonly string[];

  /**
   * Authorized unidirectional dependency pairs linking this tree to other trees.
   */
  readonly treeDependencyPairs: readonly TEffectiveOrientedPair[];
};
