import type { TReadUrlSpecifierResult } from './read-url-specifier.type.js';

import { URL_HEADER_PATTERN } from './read-url-specifier.constant.js';

export const readUrlSpecifier = (() => {
  const readQuotedUrl = (
    text: string,
    startIndex: number,
    quote: string
  ): TReadUrlSpecifierResult => {
    const isTerminatingChar = (char: string | undefined): boolean =>
      char === undefined || char === quote || char === '\n' || char === '\r';

    let index = startIndex;
    while (index < text.length) {
      const char = text[index];
      const isTrailingEscape = char === '\\' && index + 1 >= text.length;

      if (isTrailingEscape || isTerminatingChar(char)) {
        break;
      }

      if (char === '\\') {
        index += 2;
      } else {
        index += 1;
      }
    }

    const raw = text.slice(startIndex, index).replaceAll(/\\(.)/g, '$1');
    const closingParen = text.indexOf(')', index);
    const nextIndex = closingParen === -1 ? text.length : closingParen + 1;

    return { nextIndex, raw };
  };

  const readUnquotedUrl = (
    text: string,
    startIndex: number
  ): TReadUrlSpecifierResult => {
    let parenDepth = 0;
    let index = startIndex;

    while (index < text.length) {
      const char = text[index];
      if (char === '(') {
        parenDepth += 1;
        index += 1;
      } else if (char === ')' && parenDepth === 0) {
        break;
      } else if (char === ')') {
        parenDepth -= 1;
        index += 1;
      } else {
        index += 1;
      }
    }

    const raw = text.slice(startIndex, index).trim();
    const nextIndex = index < text.length ? index + 1 : text.length;

    return { nextIndex, raw };
  };

  return function readUrlSpecifier(
    text: string,
    startIndex: number
  ): null | TReadUrlSpecifierResult {
    URL_HEADER_PATTERN.lastIndex = startIndex;
    const match = URL_HEADER_PATTERN.exec(text);
    if (match === null) {
      return null;
    }

    const contentStart = startIndex + match[0].length;
    const quote = text[contentStart];
    const isQuoted = quote === '"' || quote === "'";
    return isQuoted
      ? readQuotedUrl(text, contentStart + 1, quote)
      : readUnquotedUrl(text, contentStart);
  };
})();
