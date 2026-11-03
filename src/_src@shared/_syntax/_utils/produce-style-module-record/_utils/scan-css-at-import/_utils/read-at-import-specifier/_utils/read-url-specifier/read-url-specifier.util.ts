import type { TReadUrlSpecifierResult } from './read-url-specifier.type.js';

import { readQuotedUrl } from './_utils/read-quoted-url/index.js';
import { readUnquotedUrl } from './_utils/read-unquoted-url/index.js';
import { URL_HEADER_PATTERN } from './read-url-specifier.constant.js';

export function readUrlSpecifier(
  text: string,
  startIndex: number
): TReadUrlSpecifierResult {
  URL_HEADER_PATTERN.lastIndex = startIndex;
  const match = URL_HEADER_PATTERN.exec(text);
  if (match === null) {
    return { nextIndex: startIndex, raw: '' };
  }

  const contentStart = startIndex + match[0].length;
  const quote = text[contentStart];
  const isQuoted = quote === '"' || quote === "'";
  return isQuoted
    ? readQuotedUrl(text, contentStart + 1, quote)
    : readUnquotedUrl(text, contentStart);
}
