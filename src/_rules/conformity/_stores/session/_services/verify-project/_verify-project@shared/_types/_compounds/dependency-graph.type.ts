import type { TSourceLocation } from '../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TImportSyntaxKind } from '../../../../../_session@shared/_types/module-record.type.js';

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
   * Parallel array of local-edge metadata aligned with CSR column targets.
   */
  readonly edgeMetadata: readonly TEdgeMetadata[];

  /**
   * Edge indices into columnTargets and edgeMetadata for each source file.
   */
  readonly edgesBySourcePath: ReadonlyMap<string, readonly number[]>;

  /**
   * Import arcs toward external libraries, which are not local-graph vertices.
   */
  readonly libraryNotes: readonly TLibraryNote[];

  /**
   * Library-note indices for each source file that imports an external library.
   */
  readonly libraryNotesBySourcePath: ReadonlyMap<string, readonly number[]>;

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
   * Nature of each vertex, aligned with vertexToPath.
   */
  readonly vertexNatures: readonly TVertexNature[];

  /**
   * Array translating integer vertex indices back to relative POSIX file paths.
   */
  readonly vertexToPath: readonly string[];
};

/**
 * Structural metadata associated with one directed edge between local files.
 */
export type TEdgeMetadata = {
  /**
   * Alternative base paths of the path alias matched by the specifier.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched by the specifier, or null when none was used.
   */
  readonly aliasUsed: null | string;

  /**
   * Relative POSIX path of the resolved local destination file.
   */
  readonly destinationPath: string;

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

  /**
   * Relative POSIX path of the file that contains the import.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source file.
   */
  readonly specifier: string;

  /**
   * Syntactic form of the import or re-export that produced the edge.
   */
  readonly syntaxKind: TImportSyntaxKind;
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
 * Import arc toward an external library, retained without a local vertex.
 */
export type TLibraryNote = {
  /**
   * Alternative base paths of the path alias matched by the specifier.
   */
  readonly aliasAlternatives: readonly string[];

  /**
   * Path alias prefix matched by the specifier, or null when none was used.
   */
  readonly aliasUsed: null | string;

  /**
   * Zero-based import index within the source module record.
   */
  readonly importIndex: number;

  /**
   * Flag indicating whether the library import is type-only.
   */
  readonly isTypeOnly: boolean;

  /**
   * External package or built-in module name recorded for this import arc.
   */
  readonly packageName: string;

  /**
   * Source coordinates where the library import originated.
   */
  readonly position: TSourceLocation;

  /**
   * Relative POSIX path of the file that contains the import.
   */
  readonly sourcePath: string;

  /**
   * Verbatim module specifier written by the source file.
   */
  readonly specifier: string;

  /**
   * Syntactic form of the import that refers to the external library.
   */
  readonly syntaxKind: TImportSyntaxKind;
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

/**
 * Membership of a dependency-graph vertex in a Fractal Tree or outside every Tree.
 */
export type TVertexNature =
  | {
      /**
       * Discriminant for a file that belongs to no Fractal Tree.
       */
      readonly kind: 'external-local-file';
    }
  | {
      /**
       * Inventory identifier of the file inside its Fractal Tree.
       */
      readonly inventoryId: number;

      /**
       * Discriminant for a file that belongs to a Fractal Tree.
       */
      readonly kind: 'tree-node';
    };
