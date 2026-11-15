import type { TReadBareSpecifierResult } from './read-bare-specifier.type.js';

import { DELIMITER_CHARS } from './read-bare-specifier.constant.js';

export function readBareSpecifier(
  text: string,
  startIndex: number
): TReadBareSpecifierResult {
  let braceDepth = 0;
  let index = startIndex;

  while (index < text.length) {
    const char = text[index] ?? '';
    if (char === '{') {
      braceDepth += 1;
      index += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
      index += 1;
    } else if (braceDepth === 0 && DELIMITER_CHARS.includes(char)) {
      break;
    } else {
      index += 1;
    }
  }

  const raw = text.slice(startIndex, index).trim();
  return { nextIndex: index, raw };
}
