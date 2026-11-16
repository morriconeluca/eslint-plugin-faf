/**
 * Failure compilation result identifying why a foreign pattern was rejected.
 */
export type TCompileForeignPatternFailure = {
  /**
   * Failure discriminant indicating the pattern is invalid.
   */
  readonly ok: false;

  /**
   * Standard reason identifier explaining why the foreign pattern was rejected.
   */
  readonly reason: TForeignPatternRejectReason;
};

/**
 * Result of compiling a foreign pattern into a matcher or rejecting it with a reason.
 */
export type TCompileForeignPatternResult =
  | TCompileForeignPatternFailure
  | TCompileForeignPatternSuccess;

/**
 * Successful compilation result containing a pre-compiled foreign pattern matcher.
 */
export type TCompileForeignPatternSuccess = {
  /**
   * Predicate testing whether a scope-relative path matches the foreign pattern.
   */
  readonly matcher: TForeignPatternMatcher;

  /**
   * Success discriminant indicating the pattern is valid.
   */
  readonly ok: true;
};

/**
 * Function that matches a scope-relative file path against a compiled foreign pattern.
 */
export type TForeignPatternMatcher = (relativePath: string) => boolean;

/**
 * Rejection reason code when a foreign pattern fails validation.
 */
export type TForeignPatternRejectReason =
  | 'absolute-pattern'
  | 'brace-expansion'
  | 'dot-segment'
  | 'empty-pattern'
  | 'empty-segment'
  | 'invalid-globstar'
  | 'negation'
  | 'regular-expression';
