import type { TSourceLocation } from '../../../../../../../_conformity@shared/_types/outcome.type.js';

/**
 * Compact CSR dependency graph of resolved edges between codebase files.
 */
export type TDependencyGraph = {
  /**
   * Destination vertex indices stored in contiguous CSR format.
   */
  readonly columnTargets: Int32Array;

  /**
   * Total count of directed dependency edges stored in the graph.
   */
  readonly edgeCount: number;

  /**
   * Parallel array of edge metadata records aligned with CSR column targets.
   */
  readonly edgeMetadata: readonly TEdgeMetadata[];

  /**
   * Map translating relative POSIX file paths to integer vertex indices.
   */
  readonly pathToVertex: ReadonlyMap<string, number>;

  /**
   * Offset indices into columnTargets for each vertex in compressed sparse row format.
   */
  readonly rowOffsets: Int32Array;

  /**
   * Total count of indexed vertices represented in the dependency graph.
   */
  readonly vertexCount: number;

  /**
   * Array translating integer vertex indices back to relative POSIX file paths.
   */
  readonly vertexToPath: readonly string[];
};

/**
 * Structural metadata associated with an individual directed graph edge.
 */
export type TEdgeMetadata = {
  /**
   * Zero-based import index within the source module record.
   */
  readonly importIndex: number;

  /**
   * Flag indicating whether this edge represents a type-only dependency.
   */
  readonly isTypeOnly: boolean;

  /**
   * Source coordinates where the import reference originated.
   */
  readonly position: TSourceLocation;
};

/**
 * Resolution record produced for an individual module import reference.
 */
export type TImportResolution = {
  /**
   * All alternative target paths evaluated for the matched path alias.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched during resolution, or null if direct path used.
   */
  readonly aliasUsed: null | string;

  /**
   * Zero-based index of the import statement within the source module record.
   */
  readonly importIndex: number;

  /**
   * Relative POSIX path of the source file containing the import.
   */
  readonly sourcePath: string;

  /**
   * Resolved target destination or failure justification.
   */
  readonly target: TResolvedTarget;
};

/**
 * Concrete target identified by the module resolution process.
 */
export type TResolvedTarget =
  | {
      /**
       * External npm package or built-in module name.
       */
      readonly packageName: string;

      /**
       * Target discriminant for external third-party dependencies.
       */
      readonly type: 'external-library';
    }
  | {
      /**
       * Relative POSIX path identifying the resolved local file.
       */
      readonly path: string;

      /**
       * Target discriminant for local codebase files.
       */
      readonly type: 'local-file';
    }
  | {
      /**
       * Technical explanation why module resolution failed.
       */
      readonly reason: string;

      /**
       * Target discriminant for unresolvable import references.
       */
      readonly type: 'unresolved';
    };
