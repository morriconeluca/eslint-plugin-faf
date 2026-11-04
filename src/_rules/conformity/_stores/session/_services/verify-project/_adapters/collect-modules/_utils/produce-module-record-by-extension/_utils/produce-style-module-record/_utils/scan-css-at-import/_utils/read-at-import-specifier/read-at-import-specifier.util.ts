import type { TReadAtImportSpecifierResult } from './read-at-import-specifier.type.js';

import { readBareSpecifier } from './_utils/read-bare-specifier/index.js';
import { readQuotedSpecifier } from './_utils/read-quoted-specifier/index.js';
import { readUrlSpecifier } from './_utils/read-url-specifier/index.js';

export function readAtImportSpecifier(
  text: string,
  startIndex: number
): TReadAtImportSpecifierResult {
  const quote = text[startIndex];
  const isQuoted = quote === '"' || quote === "'";
  if (isQuoted) {
    return readQuotedSpecifier(text, startIndex + 1, quote);
  }

  const isUrl = text.slice(startIndex, startIndex + 3).toLowerCase() === 'url';
  return isUrl
    ? readUrlSpecifier(text, startIndex)
    : readBareSpecifier(text, startIndex);
}
