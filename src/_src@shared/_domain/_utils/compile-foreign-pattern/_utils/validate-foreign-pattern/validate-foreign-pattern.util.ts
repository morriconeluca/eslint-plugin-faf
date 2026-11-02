import type { TForeignPatternRejectReason } from '../../compile-foreign-pattern.type.js';

import {
  BRACE_REGEX,
  DOT_SEGMENTS,
  INVALID_GLOBSTAR_REGEX,
  REGEX_SHAPE_PATTERN,
  SLASH,
} from './validate-foreign-pattern.constant.js';

export function validateForeignPattern(
  pattern: string
): null | TForeignPatternRejectReason {
  if (pattern.length === 0) {
    return 'empty-pattern';
  }
  if (pattern.startsWith('!')) {
    return 'negation';
  }
  if (BRACE_REGEX.test(pattern)) {
    return 'brace-expansion';
  }
  if (REGEX_SHAPE_PATTERN.test(pattern)) {
    return 'regular-expression';
  }
  if (pattern.startsWith(SLASH)) {
    return 'absolute-pattern';
  }

  const segments = pattern.split(SLASH);
  for (const segment of segments) {
    if (segment.length === 0) {
      return 'empty-segment';
    }
    if (DOT_SEGMENTS.has(segment)) {
      return 'dot-segment';
    }
    if (INVALID_GLOBSTAR_REGEX.test(segment)) {
      return 'invalid-globstar';
    }
  }

  return null;
}
