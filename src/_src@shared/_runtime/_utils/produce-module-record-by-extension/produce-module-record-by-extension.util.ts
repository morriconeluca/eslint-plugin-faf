import nodePathPosix from 'node:path/posix';

import type { TModuleRecordProducer } from '../../../_syntax/_types/module-record.type.js';

import { extractScriptModuleRecord } from '../../../_syntax/_utils/extract-script-module-record/index.js';
import { produceBinaryModuleRecord } from '../../../_syntax/_utils/produce-binary-module-record/index.js';
import { produceStyleModuleRecord } from '../../../_syntax/_utils/produce-style-module-record/index.js';
import {
  SCRIPT_EXTENSIONS,
  STYLE_EXTENSIONS,
} from './produce-module-record-by-extension.constant.js';

export const produceModuleRecordByExtension: TModuleRecordProducer = (
  path,
  text
) => {
  const extension = nodePathPosix.extname(path);
  if (SCRIPT_EXTENSIONS.some((candidate) => candidate === extension)) {
    return extractScriptModuleRecord(path, text);
  }
  if (STYLE_EXTENSIONS.some((candidate) => candidate === extension)) {
    return produceStyleModuleRecord(path, text);
  }
  return produceBinaryModuleRecord(path, text);
};
