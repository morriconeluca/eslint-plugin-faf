import { z } from 'zod';

import type { TConfigDiagnostic } from '../../_types/config-diagnostic.type.js';

import { DIAGNOSTIC_PREFIX } from '../../_constants/config-diagnostic.constant.js';

export const formFields = (() => {
  const CONFIG_2 = 'CONFIG_2';
  const NULL_FORBIDDEN = 'configuration/null-forbidden';
  const INVALID_TYPE = 'configuration/invalid-type';
  const EMPTY_STRING = 'configuration/empty-string';
  const EXPLICIT_UNDEFINED = 'configuration/explicit-undefined';
  const MISSING_PROPERTY = 'configuration/missing-property';

  const encode = (diagnostic: TConfigDiagnostic): string =>
    `${DIAGNOSTIC_PREFIX}${JSON.stringify(diagnostic)}`;

  const fixed = (
    constraint: `configuration/${string}`,
    normativeReference: string,
    message: string
  ): string =>
    encode({
      constraint,
      kind: 'fixed',
      message,
      normativeReference,
    });

  const nullOrType = (
    input: unknown,
    nullMessage: string,
    typeMessage: string,
    normativeReference: string
  ): string =>
    input === null
      ? fixed(NULL_FORBIDDEN, CONFIG_2, nullMessage)
      : fixed(INVALID_TYPE, normativeReference, typeMessage);

  const optionalProperty = (key: string): z.ZodType =>
    z
      .custom<unknown>((value) => value !== null && value !== undefined, {
        error: (issue) =>
          issue.input === null
            ? fixed(
                NULL_FORBIDDEN,
                CONFIG_2,
                `Property "${key}" cannot be null.`
              )
            : fixed(
                EXPLICIT_UNDEFINED,
                CONFIG_2,
                `Property "${key}" cannot be explicitly undefined.`
              ),
      })
      .exactOptional();

  const requiredAbsence = (
    key: string,
    typeMessage: string,
    typeNormativeReference: string,
    missingNormativeReference: string
  ): string =>
    encode({
      emptyList: null,
      explicit: {
        constraint: EXPLICIT_UNDEFINED,
        kind: 'fixed',
        message: `Property "${key}" cannot be explicitly undefined.`,
        normativeReference: CONFIG_2,
      },
      invalid: {
        constraint: INVALID_TYPE,
        kind: 'fixed',
        message: typeMessage,
        normativeReference: typeNormativeReference,
      },
      kind: 'absent',
      missing: {
        constraint: MISSING_PROPERTY,
        kind: 'fixed',
        message: `Required property "${key}" is missing.`,
        normativeReference: missingNormativeReference,
      },
    });

  const presenceIssue = (
    input: unknown,
    key: string,
    typeMessage: string,
    normativeReference: string
  ): string => {
    if (input === null) {
      return fixed(
        NULL_FORBIDDEN,
        CONFIG_2,
        `Property "${key}" cannot be null.`
      );
    }
    if (input === undefined) {
      return fixed(
        EXPLICIT_UNDEFINED,
        CONFIG_2,
        `Property "${key}" cannot be explicitly undefined.`
      );
    }
    return fixed(INVALID_TYPE, normativeReference, typeMessage);
  };

  const requiredText = (
    key: string,
    typeNormativeReference: string,
    missingNormativeReference: string
  ): z.ZodType<string> =>
    z
      .string({
        error: (issue) => {
          if (issue.input === undefined) {
            return encode({
              emptyList: null,
              explicit: {
                constraint: EXPLICIT_UNDEFINED,
                kind: 'fixed',
                message: `Property "${key}" cannot be explicitly undefined.`,
                normativeReference: CONFIG_2,
              },
              invalid: {
                constraint: INVALID_TYPE,
                kind: 'fixed',
                message: `Property "${key}" must be a string.`,
                normativeReference: typeNormativeReference,
              },
              kind: 'absent',
              missing: {
                constraint: MISSING_PROPERTY,
                kind: 'fixed',
                message: `Required property "${key}" is missing.`,
                normativeReference: missingNormativeReference,
              },
            });
          }
          return nullOrType(
            issue.input,
            `Property "${key}" cannot be null.`,
            `Property "${key}" must be a string.`,
            typeNormativeReference
          );
        },
      })
      .min(1, {
        error: () =>
          fixed(EMPTY_STRING, CONFIG_2, `Property "${key}" cannot be empty.`),
      });

  const textValue = (
    nullMessage: string,
    typeMessage: string,
    emptyMessage: string,
    normativeReference: string
  ): z.ZodType<string> =>
    z
      .string({
        error: (issue) =>
          nullOrType(issue.input, nullMessage, typeMessage, normativeReference),
      })
      .min(1, {
        error: () => fixed(EMPTY_STRING, CONFIG_2, emptyMessage),
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
