import type {
  TModuleRecord,
  TModuleRecordProducer,
} from '../../_types/module-record.type.js';

import {
  EMPTY_MODULE_EXPORTS,
  EMPTY_MODULE_IMPORTS,
  EMPTY_ROOT_SYMBOLS,
  EMPTY_UNSUPPORTED_SYNTAXES,
} from './produce-binary-module-record.constant.js';

export const produceBinaryModuleRecord: TModuleRecordProducer = (
  _path: string,
  _text: string
): TModuleRecord => ({
  exports: EMPTY_MODULE_EXPORTS,
  imports: EMPTY_MODULE_IMPORTS,
  language: 'binary',
  symbols: EMPTY_ROOT_SYMBOLS,
  unsupportedSyntaxes: EMPTY_UNSUPPORTED_SYNTAXES,
});
