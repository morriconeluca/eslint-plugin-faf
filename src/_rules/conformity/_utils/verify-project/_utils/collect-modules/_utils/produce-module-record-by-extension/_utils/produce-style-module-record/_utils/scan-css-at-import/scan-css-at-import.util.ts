import type { TScanAtImportResult } from './scan-css-at-import.type.js';

import { readAtImportSpecifier } from './_utils/read-at-import-specifier/index.js';
import { skipAtImportStatement } from './_utils/skip-at-import-statement/index.js';
import { IDENTIFIER_CHAR_PATTERN } from './scan-css-at-import.constant.js';

export function scanCssAtImport(
  text: string,
  startIndex: number,
  isSass: boolean
): TScanAtImportResult {
  const isAtImportKeyword =
    text.slice(startIndex, startIndex + 7).toLowerCase() === '@import';
  if (!isAtImportKeyword) {
    return { nextIndex: startIndex };
  }

  const nextChar = text[startIndex + 7];
  const isFollowedByIdentifier =
    nextChar !== undefined && IDENTIFIER_CHAR_PATTERN.test(nextChar);
  if (isFollowedByIdentifier) {
    return { nextIndex: startIndex };
  }

  let contentStart = startIndex + 7;
  while (
    contentStart < text.length &&
    (text[contentStart] === ' ' || text[contentStart] === '\t')
  ) {
    contentStart += 1;
  }

  if (contentStart >= text.length) {
    return { nextIndex: startIndex };
  }

  const specifierResult = readAtImportSpecifier(text, contentStart);
  const skipResult = skipAtImportStatement(
    text,
    specifierResult.nextIndex,
    isSass
  );

  return { nextIndex: skipResult.nextIndex, raw: specifierResult.raw };
}
