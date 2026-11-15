import type {
  TAnalyzeModuleSourceInput,
  TModuleAnalysis,
  TModuleReadFailureKind,
} from '../../../../_collect-modules@shared/_types/collect-modules.type.js';

import { collectRecordUnverifiedOutcomes } from './_utils/collect-record-unverified-outcomes/index.js';
import { isTreeFilePath } from './_utils/is-tree-file-path/index.js';
import { readFailureOutcome } from './_utils/read-failure-outcome/index.js';

export function analyzeModuleSource(
  input: TAnalyzeModuleSourceInput
): TModuleAnalysis {
  const readFailure = (kind: TModuleReadFailureKind, reason: string) =>
    readFailureOutcome({
      isTreeFile: isTreeFilePath(input.inventory, input.relativePath),
      kind,
      reason,
      relativePath: input.relativePath,
    });

  if (
    input.readResult.status !== 'text' &&
    input.readResult.status !== 'undecodable'
  ) {
    return {
      outcomes: [readFailure(input.readResult.status, input.readResult.reason)],
      record: null,
      resolutions: [],
    };
  }

  const text = input.readResult.status === 'text' ? input.readResult.text : '';
  const record = input.producer(input.relativePath, text);
  if (
    input.readResult.status === 'undecodable' &&
    record.language !== 'binary'
  ) {
    return {
      outcomes: [readFailure('undecodable', input.readResult.reason)],
      record: null,
      resolutions: [],
    };
  }

  const resolutions = input.resolver(input.relativePath, record.imports);
  return {
    outcomes: collectRecordUnverifiedOutcomes(
      input.relativePath,
      record,
      resolutions
    ),
    record,
    resolutions,
  };
}
