import type { TScanUrlResult } from './scan-css-url.type.js';

import { readUrlSpecifier } from '../../_produce-style-module-record@shared/_utils/read-url-specifier/index.js';
import { IDENTIFIER_CHAR_PATTERN } from './scan-css-url.constant.js';

export function scanCssUrl(text: string, startIndex: number): TScanUrlResult {
  const previousChar = text[startIndex - 1];
  return previousChar !== undefined &&
    IDENTIFIER_CHAR_PATTERN.test(previousChar)
    ? { nextIndex: startIndex }
    : (readUrlSpecifier(text, startIndex) ?? { nextIndex: startIndex });
}
