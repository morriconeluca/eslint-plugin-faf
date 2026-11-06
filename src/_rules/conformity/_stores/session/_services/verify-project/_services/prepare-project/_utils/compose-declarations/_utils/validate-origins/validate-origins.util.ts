import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TOriginEntry } from './validate-origins.type.js';

import { createOutcome } from '../../../../../../../../../../_conformity@shared/_utils/create-outcome/index.js';

export const validateOrigins = (
  origins: readonly TOriginEntry[]
): readonly TConfigOutcome[] => {
  const outcomes: TConfigOutcome[] = [];
  const seenByPath = new Map<string, TOriginEntry>();

  for (const entry of origins) {
    const previous = seenByPath.get(entry.path);
    if (previous === undefined) {
      seenByPath.set(entry.path, entry);
    } else {
      const isDuplicate = previous.kind === entry.kind;
      outcomes.push(
        createOutcome(
          isDuplicate
            ? 'configuration/duplicate-origin'
            : 'configuration/conflicting-origin-kind',
          {
            element: entry.path,
            propertyPath: entry.propertyPath,
          }
        )
      );
    }
  }

  for (const outer of origins) {
    const isRoot = outer.path === '.';
    const prefix = `${outer.path}/`;
    const containedOrigins = origins.filter(
      (inner) =>
        inner.path !== outer.path && (isRoot || inner.path.startsWith(prefix))
    );
    for (const inner of containedOrigins) {
      outcomes.push(
        createOutcome('configuration/overlapping-origins', {
          detail: `Origin '${inner.path}' is contained within origin '${outer.path}'`,
          element: inner.path,
          propertyPath: inner.propertyPath,
        })
      );
    }
  }

  return outcomes;
};
