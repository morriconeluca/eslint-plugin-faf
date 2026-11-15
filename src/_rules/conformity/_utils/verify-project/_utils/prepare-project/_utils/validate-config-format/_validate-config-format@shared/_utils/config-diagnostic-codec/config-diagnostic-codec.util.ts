import type { ZodError } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TAbsentDiagnostic,
  TConfigDiagnostic,
  TFixedDiagnostic,
} from './config-diagnostic-codec.type.js';

import { createOutcome } from '../../../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { assertInvariant } from '../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { formatIssuePath } from './_utils/format-issue-path/index.js';
import { hasExplicitProperty } from './_utils/has-explicit-property/index.js';
import { joinPropertyPath } from './_utils/join-property-path/index.js';
import { DIAGNOSTIC_PREFIX } from './config-diagnostic-codec.constant.js';
import { formFields } from './config-diagnostic-codec.schema.js';

export const translateConfigIssues = (() => {
  const isConfigDiagnostic = (value: unknown): value is TConfigDiagnostic => {
    const isObject = typeof value === 'object' && value !== null;
    const record = isObject && !Array.isArray(value) ? value : null;
    if (record === null || !('kind' in record)) {
      return false;
    }
    const kind = record.kind;
    const kinds = new Set(['absent', 'fixed', 'keys']);
    return formFields.isNonEmptyString(kind) && kinds.has(kind);
  };

  const decodeConfigDiagnostic = (message: string): TConfigDiagnostic => {
    assertInvariant(
      message.startsWith(DIAGNOSTIC_PREFIX),
      'Zod issue is missing a configuration diagnostic.'
    );
    const parsed: unknown = JSON.parse(message.slice(DIAGNOSTIC_PREFIX.length));
    assertInvariant(
      isConfigDiagnostic(parsed),
      'Configuration diagnostic payload is invalid.'
    );
    return parsed;
  };

  const chooseAbsentDiagnostic = (
    diagnostic: TAbsentDiagnostic,
    isEmptyArray: boolean,
    hasExplicitKey: boolean
  ): TFixedDiagnostic => {
    if (isEmptyArray && diagnostic.emptyList !== null) {
      return diagnostic.emptyList;
    }
    if (hasExplicitKey) {
      return diagnostic.explicit;
    }
    return diagnostic.missing;
  };

  const isStringKeyedRecord = (
    value: unknown,
    key: string
  ): value is Record<string, unknown> => {
    const objectValue =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value
        : null;
    return objectValue !== null && Object.hasOwn(objectValue, key);
  };

  const readConfigValue = (
    value: unknown,
    segments: readonly PropertyKey[]
  ): unknown => {
    let current = value;
    for (const segment of segments) {
      if (typeof segment === 'number' && Array.isArray(current)) {
        current = current[segment];
        continue;
      }
      if (
        typeof segment !== 'string' ||
        !isStringKeyedRecord(current, segment)
      ) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  };

  const toFixedOutcome = (
    diagnostic: TFixedDiagnostic,
    propertyPath: string
  ): TConfigOutcome =>
    createOutcome(diagnostic.constraint, {
      propertyPath,
    });

  return function translateConfigIssues(
    issues: readonly ZodError['issues'][number][],
    input: unknown,
    basePath: string
  ): readonly TConfigOutcome[] {
    const pathOf = (segments: readonly PropertyKey[]): string =>
      joinPropertyPath(basePath, formatIssuePath(segments));

    return issues.flatMap((issue) => {
      const diagnostic = decodeConfigDiagnostic(issue.message);
      const propertyPath = pathOf(issue.path);
      if (diagnostic.kind === 'keys') {
        assertInvariant(
          issue.code === 'unrecognized_keys',
          'Key diagnostic requires unrecognized keys.'
        );
        return issue.keys.map((key) =>
          toFixedOutcome(
            {
              constraint: diagnostic.constraint,
              kind: 'fixed',
            },
            joinPropertyPath(propertyPath, key)
          )
        );
      }
      if (diagnostic.kind === 'fixed') {
        return [toFixedOutcome(diagnostic, propertyPath)];
      }
      const parent = readConfigValue(input, issue.path.slice(0, -1));
      const parentObject = typeof parent === 'object' ? parent : null;
      const isEmptyArray = Array.isArray(parent) && parent.length === 0;
      const chosen = chooseAbsentDiagnostic(
        diagnostic,
        isEmptyArray,
        hasExplicitProperty(parentObject, issue.path.at(-1))
      );
      return [
        toFixedOutcome(
          chosen,
          isEmptyArray ? pathOf(issue.path.slice(0, -1)) : propertyPath
        ),
      ];
    });
  };
})();
