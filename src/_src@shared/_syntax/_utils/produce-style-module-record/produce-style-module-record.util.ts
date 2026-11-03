import type {
  TModuleImport,
  TModuleRecord,
  TUnsupportedSyntax,
} from '../../_types/module-record.type.js';
import type { TClassifiedStyleReference } from './_utils/classify-style-reference/classify-style-reference.type.js';

import { advanceCoordinates } from './_utils/advance-coordinates/index.js';
import { classifyStyleReference } from './_utils/classify-style-reference/index.js';
import { scanCssAtImport } from './_utils/scan-css-at-import/index.js';
import { scanCssUrl } from './_utils/scan-css-url/index.js';
import { skipCssBlockComment } from './_utils/skip-css-block-comment/index.js';
import { skipCssLineComment } from './_utils/skip-css-line-comment/index.js';
import { skipCssString } from './_utils/skip-css-string/index.js';
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
    const coords = advanceCoordinates(text, index, nextIndex, line, column);
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
    const blockComment = skipCssBlockComment(text, index);
    if (blockComment.skipped) {
      advanceTo(blockComment.nextIndex);
      return;
    }

    if (hasSingleLineComments) {
      const lineComment = skipCssLineComment(text, index);
      if (lineComment.skipped) {
        advanceTo(lineComment.nextIndex);
        return;
      }
    }

    const stringMatch = skipCssString(text, index);
    if (stringMatch.skipped) {
      advanceTo(stringMatch.nextIndex);
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
