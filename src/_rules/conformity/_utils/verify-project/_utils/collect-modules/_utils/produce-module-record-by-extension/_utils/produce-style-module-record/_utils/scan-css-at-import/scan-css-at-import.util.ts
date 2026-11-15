import type { TScanAtImportResult } from './scan-css-at-import.type.js';

import { readUrlSpecifier } from '../../_produce-style-module-record@shared/_utils/read-url-specifier/index.js';
import {
  DELIMITER_CHARS,
  IDENTIFIER_CHAR_PATTERN,
  SASS_NEWLINES,
  STATEMENT_TERMINATORS,
} from './scan-css-at-import.constant.js';

export const scanCssAtImport = (() => {
  type TSpecifierResult = {
    readonly nextIndex: number;
    readonly raw: string;
  };

  const readQuotedSpecifier = (
    text: string,
    startIndex: number,
    quote: string
  ): TSpecifierResult => {
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
  };

  const readBareSpecifier = (
    text: string,
    startIndex: number
  ): TSpecifierResult => {
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
  };

  const readAtImportSpecifier = (
    text: string,
    startIndex: number
  ): TSpecifierResult => {
    const quote = text[startIndex];
    const isQuoted = quote === '"' || quote === "'";
    if (isQuoted) {
      return readQuotedSpecifier(text, startIndex + 1, quote);
    }

    const isUrl =
      text.slice(startIndex, startIndex + 3).toLowerCase() === 'url';
    return isUrl
      ? (readUrlSpecifier(text, startIndex) ?? {
          nextIndex: startIndex,
          raw: '',
        })
      : readBareSpecifier(text, startIndex);
  };

  const skipAtImportStatement = (
    text: string,
    startIndex: number,
    isSass: boolean
  ): number => {
    const isStatementTerminator = (char: string | undefined): boolean =>
      char === undefined ||
      STATEMENT_TERMINATORS.includes(char) ||
      (isSass && SASS_NEWLINES.includes(char));

    let statementEnd = startIndex;
    while (!isStatementTerminator(text[statementEnd])) {
      statementEnd += 1;
    }

    return text[statementEnd] === ';' ? statementEnd + 1 : statementEnd;
  };

  return function scanCssAtImport(
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
    const nextIndex = skipAtImportStatement(
      text,
      specifierResult.nextIndex,
      isSass
    );

    return { nextIndex, raw: specifierResult.raw };
  };
})();
