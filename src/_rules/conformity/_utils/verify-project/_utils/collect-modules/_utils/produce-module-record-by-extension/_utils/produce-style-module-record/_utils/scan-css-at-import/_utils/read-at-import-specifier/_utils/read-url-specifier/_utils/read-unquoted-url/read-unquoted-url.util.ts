import type { TReadUnquotedUrlResult } from './read-unquoted-url.type.js';

export function readUnquotedUrl(
  text: string,
  startIndex: number
): TReadUnquotedUrlResult {
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
}
