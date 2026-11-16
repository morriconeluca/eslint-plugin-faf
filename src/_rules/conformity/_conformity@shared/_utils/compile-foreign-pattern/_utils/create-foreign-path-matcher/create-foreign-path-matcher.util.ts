import type { TForeignPatternMatcher } from '../../_compile-foreign-pattern@shared/_types/compile-foreign-pattern.type.js';

import {
  ASTERISK_REGEX,
  CONSECUTIVE_GLOBSTARS_REGEX,
  GLOBSTAR,
  QUESTION_REGEX,
  REGEX_SPECIAL_CHARS,
  SLASH,
} from './create-foreign-path-matcher.constant.js';

export function createForeignPathMatcher(
  pattern: string
): TForeignPatternMatcher {
  const normalized = pattern.replaceAll(CONSECUTIVE_GLOBSTARS_REGEX, '**');
  if (normalized === GLOBSTAR) {
    return (relativePath: string): boolean => relativePath.length > 0;
  }

  const segments = normalized.split(SLASH);
  const hasLeadingGlobstar = segments[0] === GLOBSTAR;
  const hasTrailingGlobstar = segments.at(-1) === GLOBSTAR;

  let regexString = hasLeadingGlobstar ? '^(?:.+/)?' : '^';
  let wasPreviousGlobstar = hasLeadingGlobstar;
  let isFirstNormalSegment = true;

  const startIndex = hasLeadingGlobstar ? 1 : 0;
  const endIndex = hasTrailingGlobstar ? -1 : segments.length;
  const innerSegments = segments.slice(startIndex, endIndex);

  for (const segment of innerSegments) {
    if (segment === GLOBSTAR) {
      wasPreviousGlobstar = true;
      continue;
    }
    let separator = '';
    if (!isFirstNormalSegment) {
      separator = wasPreviousGlobstar ? '/(?:.+/)?' : SLASH;
    }
    const escaped = segment
      .replaceAll(REGEX_SPECIAL_CHARS, '\\$&')
      .replaceAll(ASTERISK_REGEX, '[^/]*')
      .replaceAll(QUESTION_REGEX, '[^/]');
    regexString += separator + escaped;
    wasPreviousGlobstar = false;
    isFirstNormalSegment = false;
  }

  regexString += hasTrailingGlobstar ? '(?:/.+)$' : '$';
  const regex = new RegExp(regexString, 'u');
  return (relativePath: string): boolean => regex.test(relativePath);
}
