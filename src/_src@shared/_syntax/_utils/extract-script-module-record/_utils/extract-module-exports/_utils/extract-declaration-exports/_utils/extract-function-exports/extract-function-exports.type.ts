import type { FunctionType, Statement } from 'oxc-parser';

/**
 * Statement node representing a function declaration or overload signature.
 */
export type TFunctionDeclaration = Extract<Statement, TFunctionTypeFilter>;

/**
 * Type predicate filter selecting function statement types.
 */
export type TFunctionTypeFilter = {
  /**
   * AST discriminator tag for function declarations.
   */
  readonly type: FunctionType;
};
