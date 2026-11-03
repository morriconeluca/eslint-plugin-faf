import type { TForeignPatternMatcher } from '../../../../../../../../../_domain/_utils/compile-foreign-pattern/index.js';

import { compileForeignPattern } from '../../../../../../../../../_domain/_utils/compile-foreign-pattern/index.js';

export function compileFamilyMatchers(
  patterns: readonly string[]
): readonly TForeignPatternMatcher[] {
  const matchers: TForeignPatternMatcher[] = [];
  for (const pattern of patterns) {
    const compiled = compileForeignPattern(pattern);
    if (compiled.ok) {
      matchers.push(compiled.matcher);
    }
  }
  return matchers;
}
