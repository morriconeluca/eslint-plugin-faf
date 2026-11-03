import type { TReadQuotedUrlResult } from './read-quoted-url.type.js';

export function readQuotedUrl(
  text: string,
  startIndex: number,
  quote: string
): TReadQuotedUrlResult {
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
}
