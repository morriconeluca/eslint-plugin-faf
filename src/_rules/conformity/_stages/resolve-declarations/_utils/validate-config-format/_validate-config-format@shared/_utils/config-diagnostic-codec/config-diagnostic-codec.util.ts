import type { ZodError } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import type {
  TAbsentDiagnostic,
  TConfigDiagnostic,
  TFixedDiagnostic,
} from './config-diagnostic-codec.type.js';

import { createOutcome } from '../../../../../../../../../_src@shared/_utils/create-outcome/index.js';
import { assertInvariant } from '../../../../../../../_conformity@shared/_utils/assert-invariant/index.js';
import { DIAGNOSTIC_PREFIX } from './config-diagnostic-codec.constant.js';
import { formFields } from './config-diagnostic-codec.schema.js';

export function translateConfigIssues(
  issues: readonly ZodError['issues'][number][],
  input: unknown,
  basePath: string
): readonly TConfigOutcome[] {
  const pathOf = (segments: readonly PropertyKey[]): string => {
    let relativePath = '';
    for (const segment of segments) {
      if (typeof segment === 'number') {
        relativePath += `[${segment}]`;
      } else if (typeof segment === 'string' && relativePath.length === 0) {
        relativePath += segment;
      } else {
        relativePath += `.${String(segment)}`;
      }
    }
    if (relativePath.length === 0) {
      return basePath;
    }
    if (basePath.length === 0) {
      return relativePath;
    }
    return relativePath.startsWith('[')
      ? `${basePath}${relativePath}`
      : `${basePath}.${relativePath}`;
  };

  const toFixedOutcome = (
    diagnostic: TFixedDiagnostic,
    propertyPath: string
  ): TConfigOutcome =>
    createOutcome.configuration(diagnostic.constraint, {
      propertyPath,
    });

  const readParentValue = (parentSegments: readonly PropertyKey[]): unknown => {
    let parent: unknown = input;
    for (const segment of parentSegments) {
      if (typeof segment === 'number' && Array.isArray(parent)) {
        parent = parent[segment];
      } else {
        const objectValue =
          typeof parent === 'object' &&
          parent !== null &&
          !Array.isArray(parent)
            ? parent
            : null;
        if (
          typeof segment !== 'string' ||
          objectValue === null ||
          !Object.hasOwn(objectValue, segment)
        ) {
          return null;
        }
        parent = Object.getOwnPropertyDescriptor(objectValue, segment)?.value;
      }
    }
    return parent;
  };

  const resolveAbsentOutcome = (
    issue: ZodError['issues'][number],
    diagnostic: TAbsentDiagnostic,
    propertyPath: string
  ): TConfigOutcome => {
    const parentSegments = issue.path.slice(0, -1);
    const parent = readParentValue(parentSegments);
    const isEmptyArray = Array.isArray(parent) && parent.length === 0;
    const lastSegment = issue.path.at(-1);
    const isPlainParent =
      typeof parent === 'object' && parent !== null && !Array.isArray(parent);
    const hasExplicitKey =
      isPlainParent &&
      typeof lastSegment === 'string' &&
      Object.hasOwn(parent, lastSegment);

    let chosen: TFixedDiagnostic;
    if (isEmptyArray && diagnostic.emptyList !== null) {
      chosen = diagnostic.emptyList;
    } else if (hasExplicitKey) {
      chosen = diagnostic.explicit;
    } else {
      chosen = diagnostic.missing;
    }

    return toFixedOutcome(
      chosen,
      isEmptyArray ? pathOf(parentSegments) : propertyPath
    );
  };

  const translateIssue = (
    issue: ZodError['issues'][number]
  ): readonly TConfigOutcome[] => {
    const decodeIssue = (): TConfigDiagnostic => {
      assertInvariant(
        issue.message.startsWith(DIAGNOSTIC_PREFIX),
        'Zod issue is missing a configuration diagnostic.'
      );
      const parsed: unknown = JSON.parse(
        issue.message.slice(DIAGNOSTIC_PREFIX.length)
      );
      const record =
        typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          ? parsed
          : null;
      const kind =
        record !== null && 'kind' in record ? record.kind : undefined;
      const kinds = new Set(['absent', 'fixed', 'keys']);
      const isValidDiagnostic = (value: unknown): value is TConfigDiagnostic =>
        formFields.isNonEmptyString(kind) && kinds.has(kind) && value !== null;
      assertInvariant(
        isValidDiagnostic(record),
        'Configuration diagnostic payload is invalid.'
      );
      return record;
    };

    const record = decodeIssue();
    const propertyPath = pathOf(issue.path);
    if (record.kind === 'keys') {
      assertInvariant(
        issue.code === 'unrecognized_keys',
        'Key diagnostic requires unrecognized keys.'
      );
      return issue.keys.map((key) =>
        toFixedOutcome(
          {
            constraint: record.constraint,
            kind: 'fixed',
          },
          propertyPath.length === 0 ? key : `${propertyPath}.${key}`
        )
      );
    }
    return [
      record.kind === 'fixed'
        ? toFixedOutcome(record, propertyPath)
        : resolveAbsentOutcome(issue, record, propertyPath),
    ];
  };

  return issues.flatMap((issue) => translateIssue(issue));
}
