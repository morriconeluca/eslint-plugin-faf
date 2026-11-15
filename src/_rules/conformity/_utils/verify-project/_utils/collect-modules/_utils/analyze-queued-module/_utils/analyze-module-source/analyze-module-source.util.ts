import type { TUnverifiedOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TAnalyzeModuleSourceInput,
  TModuleAnalysis,
  TModuleReadFailureKind,
} from '../../../../_collect-modules@shared/_types/collect-modules.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { collectRecordUnverifiedOutcomes } from './_utils/collect-record-unverified-outcomes/index.js';

export function analyzeModuleSource(
  input: TAnalyzeModuleSourceInput
): TModuleAnalysis {
  const readFailure = (
    _kind: TModuleReadFailureKind,
    reason: string
  ): TUnverifiedOutcome => {
    const id = input.inventory.pathToId.get(input.relativePath);
    const item = id === undefined ? undefined : input.inventory.items[id];
    const isTreeFile =
      item !== undefined && item.kind === 'file' && item.treeOrigin !== null;
    const constraint = isTreeFile
      ? 'unverified/unreadable-entry'
      : 'unverified/unreadable-external-file';

    return createOutcome(constraint, {
      detail: reason,
      element: input.relativePath,
      reason,
    });
  };

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
