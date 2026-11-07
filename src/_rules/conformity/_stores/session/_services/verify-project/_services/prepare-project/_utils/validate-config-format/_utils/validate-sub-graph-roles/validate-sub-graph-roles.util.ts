import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type { TSubGraphRoleEntry } from '../../_validate-config-format@shared/_types/validate-config-format.type.js';

import { translateConfigIssues } from '../../_validate-config-format@shared/_utils/translate-config-issues/index.js';
import { subGraphRolesSchema } from './_schemas/sub-graph-roles-schema/index.js';

export const validateSubGraphRoles = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const collectEntries = (
    subGraphRoles: readonly unknown[],
    subGraphPath: string
  ): readonly TSubGraphRoleEntry[] => {
    const entries: TSubGraphRoleEntry[] = [];
    for (const [index, item] of subGraphRoles.entries()) {
      if (
        !isRecord(item) ||
        typeof item['name'] !== 'string' ||
        item['name'].length === 0
      ) {
        continue;
      }
      entries.push({ name: item['name'], path: `${subGraphPath}[${index}]` });
    }
    return entries;
  };

  return function validateSubGraphRoles(
    subGraphRoles: unknown,
    basePath: string
  ): {
    readonly entries: readonly TSubGraphRoleEntry[];
    readonly outcomes: readonly TConfigOutcome[];
  } {
    if (subGraphRoles === undefined) {
      return { entries: [], outcomes: [] };
    }
    const subGraphPath = `${basePath}.subGraphRoles`;
    const parsed = subGraphRolesSchema.safeParse(subGraphRoles);
    const outcomes = parsed.success
      ? []
      : translateConfigIssues(parsed.error.issues, subGraphRoles, subGraphPath);
    const entries = Array.isArray(subGraphRoles)
      ? collectEntries(subGraphRoles, subGraphPath)
      : [];
    return { entries, outcomes };
  };
})();
