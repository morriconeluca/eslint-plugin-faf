import type { TSourceLocation } from '../../../../../../_domain/_types/outcome.type.js';
import type { TSourceLocator } from './create-source-locator.type.js';

import { NEWLINE_CODE_POINT } from './create-source-locator.constant.js';

export function createSourceLocator(text: string): TSourceLocator {
  const lineStarts: number[] = [0];
  const length = text.length;

  for (let index = 0; index < length; index += 1) {
    if (text.codePointAt(index) === NEWLINE_CODE_POINT) {
      lineStarts.push(index + 1);
    }
  }

  const getLineStart = (index: number): number => lineStarts[index] ?? 0;

  return (offset: number): TSourceLocation => {
    let low = 0;
    let high = lineStarts.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const start = getLineStart(mid);
      if (start <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const lineIndex = low - 1;
    const lineStart = getLineStart(lineIndex);
    const line = Math.max(1, lineIndex + 1);
    const column = Math.max(1, offset - lineStart + 1);

    return { column, line };
  };
}
