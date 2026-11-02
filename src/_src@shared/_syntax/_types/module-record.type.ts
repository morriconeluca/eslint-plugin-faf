import type { TSourceLocation } from '../../_domain/_types/outcome.type.js';

/**
 * Originating provenance of an exported symbol binding.
 */
export type TExportOrigin =
  | {
      /**
       * Identifier name of the locally declared symbol being exported.
       */
      readonly symbolName: string;

      /**
       * Provenance discriminant for locally declared root-scope symbols.
       */
      readonly type: 'local-symbol';
    }
  | {
      /**
       * Module specifier string from which all symbols are re-exported.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for wildcard export-all statements.
       */
      readonly type: 'export-all';
    }
  | {
      /**
       * Module specifier string providing the entire imported namespace object.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for re-exported namespace objects.
       */
      readonly type: 'namespace';
    }
  | {
      /**
       * Name of the binding as originally exported from the foreign module.
       */
      readonly importedName: string;

      /**
       * Module specifier string providing the imported binding.
       */
      readonly specifier: string;

      /**
       * Provenance discriminant for explicitly imported foreign bindings.
       */
      readonly type: 'imported-binding';
    };

/**
 * Concrete syntax form utilized by an import or re-export declaration.
 */
export type TImportSyntaxKind =
  | 'css-at-import'
  | 'css-url'
  | 'default-import'
  | 'export-all-from'
  | 'export-named-from'
  | 'export-type-from'
  | 'literal-dynamic-import'
  | 'mixed-type-specifier-import'
  | 'named-import'
  | 'namespace-import'
  | 'non-literal-dynamic-import'
  | 'require-call'
  | 'side-effect-import'
  | 'type-only-import'
  | 'typescript-import-type'
  | 'typescript-require-import';

/**
 * Syntactic source language classification determining parsing strategy.
 */
export type TLanguageKind = 'binary' | 'script' | 'style';

/**
 * Export declaration describing public interface name, type status, and origin.
 */
export type TModuleExport = {
  /**
   * Public name through which consumers access the exported entity.
   */
  readonly exportedName: string;

  /**
   * Flag indicating whether the export exposes exclusively a type declaration.
   */
  readonly isTypeOnly: boolean;

  /**
   * Concrete origin provenance determining where the exported symbol originates.
   */
  readonly origin: TExportOrigin;

  /**
   * Source coordinates locating the export statement in source text.
   */
  readonly position: TSourceLocation;
};

/**
 * Extracted module import reference identifying target specifier and syntax.
 */
export type TModuleImport = {
  /**
   * Flag indicating whether the import participates exclusively in type space.
   */
  readonly isTypeOnly: boolean;

  /**
   * Syntactic construct expressing the module dependency in source code.
   */
  readonly kind: TImportSyntaxKind;

  /**
   * Source coordinates where the import statement or specifier appears.
   */
  readonly position: TSourceLocation;

  /**
   * Verbatim module specifier string, or null if the import is non-literal.
   */
  readonly specifier: null | string;
};

/**
 * Extracted structural metadata capturing imports, symbols, and exports of a file.
 */
export type TModuleRecord = {
  /**
   * Public symbol exports exposed by the module to external consumers.
   */
  readonly exports: readonly TModuleExport[];

  /**
   * Static and dynamic import references originating from this file.
   */
  readonly imports: readonly TModuleImport[];

  /**
   * Source content kind: binary asset, JavaScript/TypeScript script, or stylesheet.
   */
  readonly language: TLanguageKind;

  /**
   * Declarations introduced into the module root scope counted under FAF §4.
   */
  readonly symbols: readonly TRootSymbol[];

  /**
   * Unsupported language constructs requiring unverified diagnostic emission.
   */
  readonly unsupportedSyntaxes: readonly TUnsupportedSyntax[];
};

/**
 * Pure parsing function transforming file path and source text into a module record.
 */
export type TModuleRecordProducer = (
  path: string,
  text: string
) => TModuleRecord;

/**
 * Root scope declaration representing an architectural symbol under FAF §4.
 */
export type TRootSymbol = {
  /**
   * Declared identifier name introduced into the module root scope.
   */
  readonly name: string;

  /**
   * Source coordinates locating the symbol identifier declaration.
   */
  readonly position: TSourceLocation;

  /**
   * Namespace domain occupied by the symbol: value space or type space.
   */
  readonly space: TSymbolSpace;
};

/**
 * Namespace domain defining whether a symbol represents a value or a type.
 */
export type TSymbolSpace = 'type' | 'value';

/**
 * Syntactic construct exceeding static analysis capabilities of the linter.
 */
export type TUnsupportedSyntax = {
  /**
   * Technical explanation describing the unanalyzable syntax construct.
   */
  readonly description: string;

  /**
   * Source coordinates where the unsupported syntax construct appears.
   */
  readonly position: TSourceLocation;
};
