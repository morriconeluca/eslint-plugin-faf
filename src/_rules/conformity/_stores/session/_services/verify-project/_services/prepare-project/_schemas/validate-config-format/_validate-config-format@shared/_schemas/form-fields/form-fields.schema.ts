import { z } from 'zod';

import type { TConfigConstraint } from '../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TConfigDiagnostic } from '../../_types/config-diagnostic.type.js';

import { DIAGNOSTIC_PREFIX } from '../../_constants/config-diagnostic.constant.js';

export const formFields = (() => {
  const NULL_FORBIDDEN = 'configuration/null-forbidden';
  const INVALID_TYPE = 'configuration/invalid-type';
  const EMPTY_STRING = 'configuration/empty-string';
  const EXPLICIT_UNDEFINED = 'configuration/explicit-undefined';
  const MISSING_PROPERTY = 'configuration/missing-property';

  const encode = (diagnostic: TConfigDiagnostic): string =>
    `${DIAGNOSTIC_PREFIX}${JSON.stringify(diagnostic)}`;

  const fixed = (constraint: TConfigConstraint): string =>
    encode({
      constraint,
      kind: 'fixed',
    });

  const nullOrType = (input: unknown): string =>
    fixed(input === null ? NULL_FORBIDDEN : INVALID_TYPE);

  const optionalProperty = (): z.ZodType =>
    z
      .custom<unknown>((value) => value !== null && value !== undefined, {
        error: (issue) =>
          fixed(issue.input === null ? NULL_FORBIDDEN : EXPLICIT_UNDEFINED),
      })
      .exactOptional();

  const requiredAbsence = (): string =>
    encode({
      emptyList: null,
      explicit: {
        constraint: EXPLICIT_UNDEFINED,
        kind: 'fixed',
      },
      invalid: {
        constraint: INVALID_TYPE,
        kind: 'fixed',
      },
      kind: 'absent',
      missing: {
        constraint: MISSING_PROPERTY,
        kind: 'fixed',
      },
    });

  const presenceIssue = (input: unknown): string => {
    if (input === null) {
      return fixed(NULL_FORBIDDEN);
    }
    if (input === undefined) {
      return fixed(EXPLICIT_UNDEFINED);
    }
    return fixed(INVALID_TYPE);
  };

  const requiredText = (): z.ZodType<string> =>
    z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? requiredAbsence()
            : nullOrType(issue.input),
      })
      .min(1, {
        error: () => fixed(EMPTY_STRING),
      });

  const textValue = (): z.ZodType<string> =>
    z
      .string({
        error: (issue) => nullOrType(issue.input),
      })
      .min(1, {
        error: () => fixed(EMPTY_STRING),
      });

  return {
    encode,
    fixed,
    nullOrType,
    optionalProperty,
    presenceIssue,
    requiredAbsence,
    requiredText,
    textValue,
  };
})();
