import type { TForeignPatternMatcher } from '../../_compile-foreign-pattern@shared/_types/compile-foreign-pattern.type.js';

import {
  ASTERISK_REGEX,
  QUESTION_REGEX,
  REGEX_SPECIAL_CHARS,
  SLASH,
} from './create-foreign-file-name-matcher.constant.js';

export function createForeignFileNameMatcher(
  pattern: string
): TForeignPatternMatcher {
  const escaped = pattern
    .replaceAll(REGEX_SPECIAL_CHARS, '\\$&')
    .replaceAll(ASTERISK_REGEX, '.*')
    .replaceAll(QUESTION_REGEX, '.');
  const regex = new RegExp(`^${escaped}$`, 'u');

  return (relativePath: string): boolean => {
    const fileName = relativePath.slice(relativePath.lastIndexOf(SLASH) + 1);
    return regex.test(fileName);
  };
}
