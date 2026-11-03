import type { TAdvanceCoordinatesResult } from './advance-coordinates.type.js';

export function advanceCoordinates(
  text: string,
  startIndex: number,
  endIndex: number,
  startLine: number,
  startColumn: number
): TAdvanceCoordinatesResult {
  const slice = text.slice(startIndex, endIndex);
  let line = startLine;
  let lastNewline = -1;

  for (let index = 0; index < slice.length; index += 1) {
    const isNewline =
      slice[index] === '\n' ||
      (slice[index] === '\r' && slice[index + 1] !== '\n');
    if (!isNewline) {
      continue;
    }

    line += 1;
    lastNewline = index;
  }

  const column =
    lastNewline === -1
      ? startColumn + slice.length
      : slice.length - lastNewline;

  return { column, line };
}
