import type {
  TModuleImport,
  TUnsupportedSyntax,
} from '../../../../_types/module-record.type.js';

/**
 * Generic AST node representation featuring a discriminating type property.
 */
export type TAstNode = Record<string, unknown> & {
  /**
   * AST node type discriminant identifier.
   */
  readonly type: string;
};

/**
 * Extracted AST traversal items including inline imports and unsupported syntaxes.
 */
export type TTraversalResult = {
  /**
   * Inline imports discovered during AST traversal.
   */
  readonly inlineImports: readonly TModuleImport[];

  /**
   * Unsupported language constructs encountered during traversal.
   */
  readonly unsupportedSyntaxes: readonly TUnsupportedSyntax[];
};
