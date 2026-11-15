import type { TScanUrlResult } from './scan-css-url.type.js';

import { readQuotedUrl } from './_utils/read-quoted-url/index.js';
import { readUnquotedUrl } from './_utils/read-unquoted-url/index.js';
import {
  IDENTIFIER_CHAR_PATTERN,
  URL_HEADER_PATTERN,
} from './scan-css-url.constant.js';

export function scanCssUrl(text: string, startIndex: number): TScanUrlResult {
  const previousChar = text[startIndex - 1];
  if (
    previousChar !== undefined &&
    IDENTIFIER_CHAR_PATTERN.test(previousChar)
  ) {
    return { nextIndex: startIndex };
  }

  URL_HEADER_PATTERN.lastIndex = startIndex;
  const match = URL_HEADER_PATTERN.exec(text);
  if (match === null) {
    return { nextIndex: startIndex };
  }

  const contentStart = startIndex + match[0].length;
  const quote = text[contentStart];
  const isQuoted = quote === '"' || quote === "'";
  return isQuoted
    ? readQuotedUrl(text, contentStart + 1, quote)
    : readUnquotedUrl(text, contentStart);
}
