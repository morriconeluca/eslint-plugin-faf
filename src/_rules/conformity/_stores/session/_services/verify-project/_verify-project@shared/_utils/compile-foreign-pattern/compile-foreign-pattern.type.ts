import type {
  TCompileForeignPatternFailure as TCompileForeignPatternSharedFailure,
  TCompileForeignPatternResult as TCompileForeignPatternSharedResult,
  TCompileForeignPatternSuccess as TCompileForeignPatternSharedSuccess,
  TForeignPatternMatcher as TForeignPatternSharedMatcher,
  TForeignPatternRejectReason as TForeignPatternSharedRejectReason,
} from './_compile-foreign-pattern@shared/_types/compile-foreign-pattern.type.js';

/**
 * Failure compilation result identifying why a foreign pattern was rejected.
 */
export type TCompileForeignPatternFailure = TCompileForeignPatternSharedFailure;

/**
 * Result of compiling a foreign pattern into a matcher or rejecting it with a reason.
 */
export type TCompileForeignPatternResult = TCompileForeignPatternSharedResult;

/**
 * Successful compilation result containing a pre-compiled foreign pattern matcher.
 */
export type TCompileForeignPatternSuccess = TCompileForeignPatternSharedSuccess;

/**
 * Function that matches a scope-relative file path against a compiled foreign pattern.
 */
export type TForeignPatternMatcher = TForeignPatternSharedMatcher;

/**
 * Rejection reason code when a foreign pattern fails validation.
 */
export type TForeignPatternRejectReason = TForeignPatternSharedRejectReason;
