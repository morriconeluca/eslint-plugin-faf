import type { TSkipBlockCommentResult } from './skip-css-block-comment.type.js';

export function skipCssBlockComment(
  text: string,
  startIndex: number
): TSkipBlockCommentResult {
  const isBlockStart = text[startIndex] === '/' && text[startIndex + 1] === '*';
  if (!isBlockStart) {
    return {
      nextIndex: startIndex,
      skipped: false,
    };
  }

  const closingIndex = text.indexOf('*/', startIndex + 2);
  const nextIndex = closingIndex === -1 ? text.length : closingIndex + 2;

  return {
    nextIndex,
    skipped: true,
  };
}
