import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type {
  TExtensionEntry,
  TRoleEntry,
  TRolesValidationResult,
  TSubGraphRoleEntry,
} from '../../validate-config-format.type.js';

import {
  CONFIG_3,
  CONSTRAINT_DUPLICATE_CATEGORY,
  CONSTRAINT_DUPLICATE_IMPLICIT_EXT,
  CONSTRAINT_DUPLICATE_ROLE_NAME,
  CONSTRAINT_IMPLICIT_EXT_PREFIX,
  CONSTRAINT_ROLE_NAME_CONFLICT,
} from './check-catalog-invariants.constant.js';

export function checkCatalogInvariants(
  roleValidation: TRolesValidationResult,
  subGraphEntries: readonly TSubGraphRoleEntry[],
  outcomes: TConfigOutcome[]
): void {
  const addOutcome = (
    propertyPath: string,
    constraint: `configuration/${string}`,
    message: string
  ): void => {
    outcomes.push({
      constraint,
      element: propertyPath,
      family: 'configuration',
      message,
      normativeReference: CONFIG_3,
      propertyPath,
    });
  };

  const checkDuplicatesInMap = (
    entries: readonly { readonly name: string; readonly path: string }[],
    constraint: `configuration/${string}`,
    messagePrefix: string
  ): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    for (const entry of entries) {
      const list = map.get(entry.name);
      if (list === undefined) {
        map.set(entry.name, [entry.path]);
      } else {
        list.push(entry.path);
      }
    }

    for (const [name, paths] of map) {
      if (paths.length > 1) {
        for (const targetPath of paths.slice(1)) {
          addOutcome(targetPath, constraint, `${messagePrefix} "${name}".`);
        }
      }
    }

    return map;
  };

  const roleNameEntries = roleValidation.roleEntries.map((r: TRoleEntry) => ({
    name: r.name,
    path: `${r.path}.name`,
  }));
  const roleNamesMap = checkDuplicatesInMap(
    roleNameEntries,
    CONSTRAINT_DUPLICATE_ROLE_NAME,
    'Duplicate role name'
  );

  const categoryEntries = roleValidation.roleEntries.map((r: TRoleEntry) => ({
    name: r.category,
    path: `${r.path}.category`,
  }));
  checkDuplicatesInMap(
    categoryEntries,
    CONSTRAINT_DUPLICATE_CATEGORY,
    'Category is already assigned to another role'
  );

  const subGraphNameEntries = subGraphEntries.map((s: TSubGraphRoleEntry) => ({
    name: s.name,
    path: `${s.path}.name`,
  }));
  const subGraphNamesMap = checkDuplicatesInMap(
    subGraphNameEntries,
    CONSTRAINT_DUPLICATE_ROLE_NAME,
    'Duplicate sub-graph role name'
  );

  for (const entry of subGraphEntries) {
    if (roleNamesMap.has(entry.name)) {
      addOutcome(
        `${entry.path}.name`,
        CONSTRAINT_ROLE_NAME_CONFLICT,
        `Sub-graph role "${entry.name}" conflicts with standard role name.`
      );
    }
  }

  const extensionMap = new Map<string, TExtensionEntry>();
  for (const entry of roleValidation.extensionEntries) {
    const existing = extensionMap.get(entry.extension);
    if (existing === undefined) {
      extensionMap.set(entry.extension, entry);
    } else {
      addOutcome(
        entry.path,
        CONSTRAINT_DUPLICATE_IMPLICIT_EXT,
        `Implicit extension "${entry.extension}" is already associated with role "${existing.roleName}".`
      );
    }
  }

  const allCatalogNames = new Set<string>([
    ...roleNamesMap.keys(),
    ...subGraphNamesMap.keys(),
  ]);

  for (const entry of roleValidation.extensionEntries) {
    const afterDot = entry.extension.slice(1);
    const dotIndex = afterDot.indexOf('.');
    const firstSegment =
      dotIndex === -1 ? afterDot : afterDot.slice(0, dotIndex);

    if (allCatalogNames.has(firstSegment)) {
      addOutcome(
        entry.path,
        CONSTRAINT_IMPLICIT_EXT_PREFIX,
        `First segment "${firstSegment}" of implicit extension "${entry.extension}" cannot match a role name.`
      );
    }
  }
}
