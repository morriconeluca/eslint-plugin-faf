import type { TCompileForeignPatternResult } from './compile-foreign-pattern.type.js';

import { createForeignFileNameMatcher } from './_utils/create-foreign-file-name-matcher/index.js';
import { createForeignPathMatcher } from './_utils/create-foreign-path-matcher/index.js';
import { validateForeignPattern } from './_utils/validate-foreign-pattern/index.js';
import { SLASH } from './compile-foreign-pattern.constant.js';

export function compileForeignPattern(
  pattern: string
): TCompileForeignPatternResult {
  const reason = validateForeignPattern(pattern);
  if (reason !== null) {
    return {
      ok: false,
      reason,
    };
  }

  return {
    matcher: pattern.includes(SLASH)
      ? createForeignPathMatcher(pattern)
      : createForeignFileNameMatcher(pattern),
    ok: true,
  };
}
