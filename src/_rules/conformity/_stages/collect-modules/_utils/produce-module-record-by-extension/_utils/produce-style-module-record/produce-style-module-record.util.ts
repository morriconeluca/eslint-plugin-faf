import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../../../../../_conformity@shared/_types/verification-model.type.js';
import type { TClassifiedStyleReference } from './_utils/classify-style-reference/index.js';

import { classifyStyleReference } from './_utils/classify-style-reference/index.js';
import { scanCssAtImport } from './_utils/scan-css-at-import/index.js';
import { scanCssUrl } from './_utils/scan-css-url/index.js';
import {
  EMPTY_STYLE_EXPORTS,
  EMPTY_STYLE_SYMBOLS,
  SASS_EXTENSIONS,
  SINGLE_LINE_EXTENSIONS,
} from './produce-style-module-record.constant.js';

export function produceStyleModuleRecord(
  path: string,
  text: string
): TModuleRecord {
  const advanceCoordinates = (
    startIndex: number,
    endIndex: number,
    startLine: number,
    startColumn: number
  ): { readonly column: number; readonly line: number } => {
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
  };

  const skipCssBlockComment = (startIndex: number): null | number => {
    const isBlockStart =
      text[startIndex] === '/' && text[startIndex + 1] === '*';
    if (!isBlockStart) {
      return null;
    }

    const closingIndex = text.indexOf('*/', startIndex + 2);
    return closingIndex === -1 ? text.length : closingIndex + 2;
  };

  const skipCssLineComment = (startIndex: number): null | number => {
    const isLineStart =
      text[startIndex] === '/' && text[startIndex + 1] === '/';
    if (!isLineStart) {
      return null;
    }

    const newlineIndex = text.indexOf('\n', startIndex + 2);
    return newlineIndex === -1 ? text.length : newlineIndex + 1;
  };

  const skipCssString = (startIndex: number): null | number => {
    const quote = text[startIndex];
    if (quote !== '"' && quote !== "'") {
      return null;
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

    return Math.min(index, text.length);
  };

  const imports: TModuleImport[] = [];
  const unsupportedSyntaxes: TUnsupportedSyntax[] = [];

  const lowerPath = path.toLowerCase();
  const isSass = SASS_EXTENSIONS.some((extension) =>
    lowerPath.endsWith(extension)
  );
  const hasSingleLineComments = SINGLE_LINE_EXTENSIONS.some((extension) =>
    lowerPath.endsWith(extension)
  );

  let index = 0;
  let line = 1;
  let column = 1;

  const advanceTo = (nextIndex: number): void => {
    const coords = advanceCoordinates(index, nextIndex, line, column);
    line = coords.line;
    column = coords.column;
    index = nextIndex;
  };

  const recordClassified = (classified: TClassifiedStyleReference): void => {
    if (classified.importItem !== undefined) {
      imports.push(classified.importItem);
    }
    if (classified.unsupportedSyntax !== undefined) {
      unsupportedSyntaxes.push(classified.unsupportedSyntax);
    }
  };

  const advanceOneChar = (): void => {
    const char = text[index];
    index += 1;
    if (char === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  };

  const processScannerStep = (): void => {
    const blockEnd = skipCssBlockComment(index);
    if (blockEnd !== null) {
      advanceTo(blockEnd);
      return;
    }

    if (hasSingleLineComments) {
      const lineEnd = skipCssLineComment(index);
      if (lineEnd !== null) {
        advanceTo(lineEnd);
        return;
      }
    }

    const stringEnd = skipCssString(index);
    if (stringEnd !== null) {
      advanceTo(stringEnd);
      return;
    }

    const atImport = scanCssAtImport(text, index, isSass);
    if (atImport.raw !== undefined) {
      recordClassified(
        classifyStyleReference('css-at-import', { column, line }, atImport.raw)
      );
      advanceTo(atImport.nextIndex);
      return;
    }

    const urlMatch = scanCssUrl(text, index);
    if (urlMatch.raw !== undefined) {
      recordClassified(
        classifyStyleReference('css-url', { column, line }, urlMatch.raw)
      );
      advanceTo(urlMatch.nextIndex);
      return;
    }

    advanceOneChar();
  };

  while (index < text.length) {
    processScannerStep();
  }

  return {
    exports: EMPTY_STYLE_EXPORTS,
    imports,
    language: 'style',
    symbols: EMPTY_STYLE_SYMBOLS,
    unsupportedSyntaxes,
  };
}
