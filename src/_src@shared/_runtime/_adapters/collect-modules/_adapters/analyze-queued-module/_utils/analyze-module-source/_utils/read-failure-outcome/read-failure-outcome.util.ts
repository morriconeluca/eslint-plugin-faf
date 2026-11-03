import type { TUnverifiedOutcome } from '../../../../../../../../../_domain/_types/outcome.type.js';
import type { TReadFailureInput } from './read-failure-outcome.type.js';

import {
  EXTERNAL_NORMATIVE_REFERENCE,
  TREE_NORMATIVE_REFERENCE,
  UNREADABLE_ENTRY_CONSTRAINT,
  UNREADABLE_EXTERNAL_FILE_CONSTRAINT,
  UNVERIFIED_FAMILY,
} from '../../../../../../_collect-modules@shared/_constants/collect-modules.constant.js';

export function readFailureOutcome(
  input: TReadFailureInput
): TUnverifiedOutcome {
  const constraint = input.isTreeFile
    ? UNREADABLE_ENTRY_CONSTRAINT
    : UNREADABLE_EXTERNAL_FILE_CONSTRAINT;
  const normativeReference = input.isTreeFile
    ? TREE_NORMATIVE_REFERENCE
    : EXTERNAL_NORMATIVE_REFERENCE;
  switch (input.kind) {
    case 'directory': {
      return {
        constraint,
        element: input.relativePath,
        family: UNVERIFIED_FAMILY,
        message: `File '${input.relativePath}' is a directory.`,
        normativeReference,
        reason: input.reason,
      };
    }
    case 'missing': {
      return {
        constraint,
        element: input.relativePath,
        family: UNVERIFIED_FAMILY,
        message: `File '${input.relativePath}' is missing.`,
        normativeReference,
        reason: input.reason,
      };
    }
    case 'undecodable': {
      return {
        constraint,
        element: input.relativePath,
        family: UNVERIFIED_FAMILY,
        message: `File '${input.relativePath}' is not valid UTF-8.`,
        normativeReference,
        reason: input.reason,
      };
    }
    case 'unreadable': {
      return {
        constraint,
        element: input.relativePath,
        family: UNVERIFIED_FAMILY,
        message: `File '${input.relativePath}' could not be read: ${input.reason}`,
        normativeReference,
        reason: input.reason,
      };
    }
  }
}
