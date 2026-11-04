import nodeFs from 'node:fs';
import nodePath from 'node:path';

import type { TReadModuleTextResult } from '../../../../_collect-modules@shared/_types/_aggregates/collect-modules.type.js';

export function readModuleText(
  baseDirectory: string,
  relativePath: string
): TReadModuleTextResult {
  const decodeModuleBytes = (bytes: Uint8Array): TReadModuleTextResult => {
    try {
      return {
        status: 'text',
        text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      };
    } catch (error: unknown) {
      return {
        reason: `Text is not valid UTF-8: ${String(error)}`,
        status: 'undecodable',
      };
    }
  };

  const absolutePath = nodePath.join(baseDirectory, relativePath);
  try {
    const stats = nodeFs.statSync(absolutePath, { throwIfNoEntry: false });
    if (stats === undefined) {
      return { reason: 'File is missing', status: 'missing' };
    }
    if (stats.isDirectory()) {
      return { reason: 'Path is a directory', status: 'directory' };
    }
    if (!stats.isFile()) {
      return { reason: 'Path is not a regular file', status: 'unreadable' };
    }
    return decodeModuleBytes(nodeFs.readFileSync(absolutePath));
  } catch (error: unknown) {
    return {
      reason: String(error),
      status: 'unreadable',
    };
  }
}
