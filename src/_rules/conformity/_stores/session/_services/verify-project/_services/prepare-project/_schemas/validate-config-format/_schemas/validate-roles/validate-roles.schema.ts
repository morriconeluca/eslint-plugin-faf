import type { TConfigOutcome } from '../../../../../../../../../../_conformity@shared/_types/outcome.type.js';
import type {
  TExtensionEntry,
  TRoleEntry,
  TRolesValidationResult,
} from '../../_validate-config-format@shared/_types/validate-config-format.type.js';

import { translateConfigIssues } from '../../_validate-config-format@shared/_schemas/translate-config-issues/index.js';
import { rolesSchema } from './_schemas/roles-schema/index.js';
import {
  CONFIG_2,
  CONFIG_3,
  CONSTRAINT_CATEGORY_NODE_MISMATCH,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_INVALID_IMPLICIT_EXT,
  FORBIDDEN_CODE_EXTENSIONS,
  GLOB_PATTERN_CHARACTERS,
} from './validate-roles.constant.js';

export const validateRoles = (() => {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const extensionOutcome = (
    propertyPath: string,
    constraint: `configuration/${string}`,
    normativeReference: string,
    message: string
  ): TConfigOutcome => ({
    constraint,
    element: propertyPath,
    family: 'configuration',
    message,
    normativeReference,
    propertyPath,
  });

  const extensionFormatOutcomes = (
    extension: string,
    extensionPath: string
  ): readonly TConfigOutcome[] => {
    const outcomes: TConfigOutcome[] = [];
    if (!extension.startsWith('.')) {
      outcomes.push(
        extensionOutcome(
          extensionPath,
          CONSTRAINT_INVALID_IMPLICIT_EXT,
          CONFIG_3,
          `Implicit extension "${extension}" must start with a leading dot.`
        )
      );
    }
    if (extension.includes('/')) {
      outcomes.push(
        extensionOutcome(
          extensionPath,
          CONSTRAINT_INVALID_IMPLICIT_EXT,
          CONFIG_3,
          `Implicit extension "${extension}" cannot be a path.`
        )
      );
    }
    if (GLOB_PATTERN_CHARACTERS.test(extension)) {
      outcomes.push(
        extensionOutcome(
          extensionPath,
          CONSTRAINT_INVALID_IMPLICIT_EXT,
          CONFIG_3,
          `Implicit extension "${extension}" cannot contain pattern characters.`
        )
      );
    }
    if (FORBIDDEN_CODE_EXTENSIONS.has(extension)) {
      outcomes.push(
        extensionOutcome(
          extensionPath,
          CONSTRAINT_INVALID_IMPLICIT_EXT,
          CONFIG_3,
          `Implicit extension "${extension}" cannot be a TypeScript or JavaScript code extension.`
        )
      );
    }
    return outcomes;
  };

  const readIdentity = (
    record: Record<string, unknown>
  ): null | { category: string; name: string } => {
    const { category, name } = record;
    const isName = typeof name === 'string' && name.length > 0;
    const isCategory = typeof category === 'string' && category.length > 0;
    return isName && isCategory ? { category, name } : null;
  };

  const recordExtension = (
    extension: unknown,
    extensionPath: string,
    seen: Set<string>,
    identity: null | { category: string; name: string },
    extensionEntries: TExtensionEntry[],
    outcomes: TConfigOutcome[]
  ): void => {
    if (typeof extension !== 'string' || extension.length === 0) {
      return;
    }
    if (seen.has(extension)) {
      outcomes.push(
        extensionOutcome(
          extensionPath,
          CONSTRAINT_DUPLICATE_ELEMENT,
          CONFIG_2,
          `Duplicate implicit extension "${extension}" in the same role.`
        )
      );
      return;
    }
    seen.add(extension);
    const formatOutcomes = extensionFormatOutcomes(extension, extensionPath);
    outcomes.push(...formatOutcomes);
    if (identity !== null && formatOutcomes.length === 0) {
      extensionEntries.push({
        extension,
        path: extensionPath,
        roleName: identity.name,
      });
    }
  };

  const collectRole = (
    record: Record<string, unknown>,
    rolePath: string,
    roleEntries: TRoleEntry[],
    extensionEntries: TExtensionEntry[],
    outcomes: TConfigOutcome[]
  ): void => {
    const identity = readIdentity(record);
    if (identity !== null) {
      roleEntries.push({ ...identity, path: rolePath });
    }
    const extensions = record['implicitRoleExtensions'];
    if (!Array.isArray(extensions) || extensions.length === 0) {
      return;
    }
    if (record['isCategoryNode'] === false) {
      outcomes.push(
        extensionOutcome(
          `${rolePath}.isCategoryNode`,
          CONSTRAINT_CATEGORY_NODE_MISMATCH,
          CONFIG_3,
          'Role with implicit extensions cannot set isCategoryNode to false.'
        )
      );
    }
    const seen = new Set<string>();
    for (const [index, extension] of extensions.entries()) {
      recordExtension(
        extension,
        `${rolePath}.implicitRoleExtensions[${index}]`,
        seen,
        identity,
        extensionEntries,
        outcomes
      );
    }
  };

  const collectGroup = (
    item: readonly unknown[],
    itemPath: string,
    roleEntries: TRoleEntry[],
    extensionEntries: TExtensionEntry[],
    outcomes: TConfigOutcome[]
  ): void => {
    for (const [subIndex, subItem] of item.entries()) {
      if (isRecord(subItem)) {
        collectRole(
          subItem,
          `${itemPath}[${subIndex}]`,
          roleEntries,
          extensionEntries,
          outcomes
        );
      }
    }
  };

  const collectRoles = (
    roles: readonly unknown[],
    rolesPath: string
  ): TRolesValidationResult & {
    readonly outcomes: readonly TConfigOutcome[];
  } => {
    const roleEntries: TRoleEntry[] = [];
    const extensionEntries: TExtensionEntry[] = [];
    const outcomes: TConfigOutcome[] = [];
    for (const [index, item] of roles.entries()) {
      const itemPath = `${rolesPath}[${index}]`;
      if (Array.isArray(item)) {
        collectGroup(item, itemPath, roleEntries, extensionEntries, outcomes);
      }
      if (!Array.isArray(item) && isRecord(item)) {
        collectRole(item, itemPath, roleEntries, extensionEntries, outcomes);
      }
    }
    return { extensionEntries, outcomes, roleEntries };
  };

  return function validateRoles(
    roles: unknown,
    basePath: string
  ): TRolesValidationResult & { readonly outcomes: readonly TConfigOutcome[] } {
    if (roles === undefined) {
      return { extensionEntries: [], outcomes: [], roleEntries: [] };
    }
    const rolesPath = `${basePath}.roles`;
    const parsed = rolesSchema.safeParse(roles);
    const formOutcomes = parsed.success
      ? []
      : translateConfigIssues(parsed.error.issues, roles, rolesPath);
    if (!Array.isArray(roles)) {
      return { extensionEntries: [], outcomes: formOutcomes, roleEntries: [] };
    }
    const collected = collectRoles(roles, rolesPath);
    return {
      extensionEntries: collected.extensionEntries,
      outcomes: [...formOutcomes, ...collected.outcomes],
      roleEntries: collected.roleEntries,
    };
  };
})();
