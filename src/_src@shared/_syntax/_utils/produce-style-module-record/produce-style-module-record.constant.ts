import type {
  TModuleExport,
  TRootSymbol,
} from '../../_types/module-record.type.js';

export const EMPTY_STYLE_EXPORTS: readonly TModuleExport[] = [];
export const EMPTY_STYLE_SYMBOLS: readonly TRootSymbol[] = [];
export const SASS_EXTENSIONS = ['.sass'] as const;
export const SINGLE_LINE_EXTENSIONS = ['.scss', '.sass', '.less'] as const;
