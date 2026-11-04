import type { ZodError } from 'zod';

import type { TConfigOutcome } from '../../../../../../../../../../../_conformity@shared/_types/outcome.type.js';

import { assertInvariant } from '../../../../../../../_verify-project@shared/_utils/assert-invariant/index.js';
import { readConfigValue } from './_schemas/read-config-value/index.js';
import { chooseAbsentDiagnostic } from './_utils/choose-absent-diagnostic/index.js';
import { decodeConfigDiagnostic } from './_utils/decode-config-diagnostic/index.js';
import { formatIssuePath } from './_utils/format-issue-path/index.js';
import { hasExplicitProperty } from './_utils/has-explicit-property/index.js';
import { joinPropertyPath } from './_utils/join-property-path/index.js';
import { toFixedOutcome } from './_utils/to-fixed-outcome/index.js';
import { unknownKeyMessage } from './_utils/unknown-key-message/index.js';

export function translateConfigIssues(
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
            message: unknownKeyMessage(diagnostic.messageStyle, key),
            normativeReference: diagnostic.normativeReference,
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
}
