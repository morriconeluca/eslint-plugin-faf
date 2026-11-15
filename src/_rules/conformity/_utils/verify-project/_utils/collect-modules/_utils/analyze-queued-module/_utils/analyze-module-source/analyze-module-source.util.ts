import type { TUnverifiedOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type { TInventory } from '../../../../../../_verify-project@shared/_types/verification-model.type.js';
import type {
  TAnalyzeModuleSourceInput,
  TModuleAnalysis,
  TModuleReadFailureKind,
} from '../../../../_collect-modules@shared/_types/collect-modules.type.js';

import { createOutcome } from '../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { collectRecordUnverifiedOutcomes } from './_utils/collect-record-unverified-outcomes/index.js';

export const analyzeModuleSource = (() => {
  const isTreeFilePath = (inventory: TInventory, path: string): boolean => {
    const id = inventory.pathToId.get(path);
    if (id === undefined) {
      return false;
    }
    const item = inventory.items[id];
    return (
      item !== undefined && item.kind === 'file' && item.treeOrigin !== null
    );
  };

  const readFailureOutcome = (
    isTreeFile: boolean,
    _kind: TModuleReadFailureKind,
    reason: string,
    relativePath: string
  ): TUnverifiedOutcome => {
    const constraint = isTreeFile
      ? 'unverified/unreadable-entry'
      : 'unverified/unreadable-external-file';

    return createOutcome(constraint, {
      detail: reason,
      element: relativePath,
      reason,
    });
  };

  return function analyzeModuleSource(
    input: TAnalyzeModuleSourceInput
  ): TModuleAnalysis {
    const readFailure = (kind: TModuleReadFailureKind, reason: string) =>
      readFailureOutcome(
        isTreeFilePath(input.inventory, input.relativePath),
        kind,
        reason,
        input.relativePath
      );

    if (
      input.readResult.status !== 'text' &&
      input.readResult.status !== 'undecodable'
    ) {
      return {
        outcomes: [
          readFailure(input.readResult.status, input.readResult.reason),
        ],
        record: null,
        resolutions: [],
      };
    }

    const text =
      input.readResult.status === 'text' ? input.readResult.text : '';
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
  };
})();
