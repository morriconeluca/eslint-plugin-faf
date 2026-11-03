import type { TReadQuotedSpecifierResult } from './read-quoted-specifier.type.js';

export function readQuotedSpecifier(
  text: string,
  startIndex: number,
  quote: string
): TReadQuotedSpecifierResult {
  const terminators: ReadonlySet<string> = new Set(['\n', '\r', quote]);

  let index = startIndex;
  while (index < text.length && !terminators.has(text[index] ?? '')) {
    if (text[index] === '\\') {
      if (index + 1 >= text.length) {
        break;
      }
      index += 2;
    } else {
      index += 1;
    }
  }

  const raw = text.slice(startIndex, index).replaceAll(/\\(.)/g, '$1');
  const isClosed = index < text.length && text[index] === quote;
  const nextIndex = isClosed ? index + 1 : index;

  return { nextIndex, raw };
}
