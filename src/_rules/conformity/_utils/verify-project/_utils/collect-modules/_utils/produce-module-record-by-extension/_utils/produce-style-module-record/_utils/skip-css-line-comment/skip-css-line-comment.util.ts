import type { TSkipLineCommentResult } from './skip-css-line-comment.type.js';

export function skipCssLineComment(
  text: string,
  startIndex: number
): TSkipLineCommentResult {
  const isLineStart = text[startIndex] === '/' && text[startIndex + 1] === '/';
  if (!isLineStart) {
    return {
      nextIndex: startIndex,
      skipped: false,
    };
  }

  const newlineIndex = text.indexOf('\n', startIndex + 2);
  const nextIndex = newlineIndex === -1 ? text.length : newlineIndex + 1;

  return {
    nextIndex,
    skipped: true,
  };
}
