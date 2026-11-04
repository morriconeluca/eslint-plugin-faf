import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TOriginEntry } from './validate-origins.type.js';

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
      outcomes.push({
        constraint: isDuplicate
          ? 'configuration/duplicate-origin'
          : 'configuration/conflicting-origin-kind',
        element: entry.path,
        family: 'configuration',
        message: isDuplicate
          ? `Origin '${entry.path}' is declared more than once.`
          : `Origin '${entry.path}' cannot be designated as both a Root Layer and a Root Fragment.`,
        normativeReference: 'CONFIG_5',
        propertyPath: entry.propertyPath,
      });
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
      outcomes.push({
        constraint: 'configuration/overlapping-origins',
        element: inner.path,
        family: 'configuration',
        message: `Origin '${inner.path}' is contained within origin '${outer.path}'.`,
        normativeReference: 'CONFIG_5',
        propertyPath: inner.propertyPath,
      });
    }
  }

  return outcomes;
};
