import type { TSkipStringResult } from './skip-css-string.type.js';

export function skipCssString(
  text: string,
  startIndex: number
): TSkipStringResult {
  const quote = text[startIndex];
  const isStringStart = quote === '"' || quote === "'";
  if (!isStringStart) {
    return {
      nextIndex: startIndex,
      skipped: false,
    };
  }

  let index = startIndex + 1;
  while (index < text.length) {
    const char = text[index];
    if (char === '\\') {
      index += 2;
    } else if (char === quote || char === '\n' || char === '\r') {
      index += 1;
      break;
    } else {
      index += 1;
    }
  }

  const nextIndex = Math.min(index, text.length);
  return {
    nextIndex,
    skipped: true,
  };
}
