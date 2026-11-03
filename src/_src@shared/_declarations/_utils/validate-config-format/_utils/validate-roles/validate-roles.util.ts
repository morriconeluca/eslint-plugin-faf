import type { TConfigOutcome } from '../../../../../_domain/_types/outcome.type.js';
import type {
  TExtensionEntry,
  TRoleEntry,
  TRolesValidationResult,
} from '../../validate-config-format.type.js';

import {
  CONFIG_2,
  CONFIG_3,
  CONSTRAINT_CATEGORY_NODE_MISMATCH,
  CONSTRAINT_DUPLICATE_ELEMENT,
  CONSTRAINT_EMPTY_LIST,
  CONSTRAINT_EMPTY_STRING,
  CONSTRAINT_EXPLICIT_UNDEFINED,
  CONSTRAINT_INVALID_IMPLICIT_EXT,
  CONSTRAINT_INVALID_TYPE,
  CONSTRAINT_MISSING_PROPERTY,
  CONSTRAINT_NULL_FORBIDDEN,
  CONSTRAINT_UNKNOWN_PROPERTY,
  FORBIDDEN_CODE_EXTENSIONS,
  GLOB_PATTERN_CHARACTERS,
  ROLE_ALLOWED_PROPERTIES,
} from './validate-roles.constant.js';

export function validateRoles(
  roles: unknown,
  basePath: string,
  outcomes: TConfigOutcome[]
): TRolesValidationResult {
  if (roles === undefined) {
    return { extensionEntries: [], roleEntries: [] };
  }

  const rolesPath = `${basePath}.roles`;
  if (roles === null) {
    outcomes.push({
      constraint: CONSTRAINT_NULL_FORBIDDEN,
      element: rolesPath,
      family: 'configuration',
      message: 'Property "roles" cannot be null.',
      normativeReference: CONFIG_2,
      propertyPath: rolesPath,
    });
    return { extensionEntries: [], roleEntries: [] };
  }

  if (!Array.isArray(roles)) {
    outcomes.push({
      constraint: CONSTRAINT_INVALID_TYPE,
      element: rolesPath,
      family: 'configuration',
      message: 'Property "roles" must be an array.',
      normativeReference: CONFIG_2,
      propertyPath: rolesPath,
    });
    return { extensionEntries: [], roleEntries: [] };
  }

  const roleEntries: TRoleEntry[] = [];
  const extensionEntries: TExtensionEntry[] = [];

  const isPlainRecord = (
    candidate: unknown
  ): candidate is Record<string, unknown> =>
    typeof candidate === 'object' &&
    candidate !== null &&
    !Array.isArray(candidate);

  const addOutcome = (
    propertyPath: string,
    constraint: `configuration/${string}`,
    normativeReference: string,
    message: string
  ): void => {
    outcomes.push({
      constraint,
      element: propertyPath,
      family: 'configuration',
      message,
      normativeReference,
      propertyPath,
    });
  };

  const checkUnknownAndNil = (
    record: Record<string, unknown>,
    rolePath: string
  ): void => {
    for (const [key, value] of Object.entries(record)) {
      const propertyPath = `${rolePath}.${key}`;
      if (!ROLE_ALLOWED_PROPERTIES.has(key)) {
        addOutcome(
          propertyPath,
          CONSTRAINT_UNKNOWN_PROPERTY,
          CONFIG_3,
          `Unknown property "${key}" is forbidden.`
        );
      } else if (value === null) {
        addOutcome(
          propertyPath,
          CONSTRAINT_NULL_FORBIDDEN,
          CONFIG_2,
          `Property "${key}" cannot be null.`
        );
      } else {
        if (value === undefined) {
          addOutcome(
            propertyPath,
            CONSTRAINT_EXPLICIT_UNDEFINED,
            CONFIG_2,
            `Property "${key}" cannot be explicitly undefined.`
          );
        }
      }
    }
  };

  const validateExtensionItem = (
    extension: unknown,
    extensionPath: string,
    roleName: string,
    seenInRole: Set<string>
  ): void => {
    if (extension === null) {
      addOutcome(
        extensionPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Implicit extension cannot be null.'
      );
      return;
    }
    if (typeof extension !== 'string') {
      addOutcome(
        extensionPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Implicit extension must be a string.'
      );
      return;
    }
    if (extension.length === 0) {
      addOutcome(
        extensionPath,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Implicit extension cannot be empty.'
      );
      return;
    }

    let isFormatValid = true;
    if (!extension.startsWith('.')) {
      isFormatValid = false;
      addOutcome(
        extensionPath,
        CONSTRAINT_INVALID_IMPLICIT_EXT,
        CONFIG_3,
        `Implicit extension "${extension}" must start with a leading dot.`
      );
    }
    if (extension.includes('/')) {
      isFormatValid = false;
      addOutcome(
        extensionPath,
        CONSTRAINT_INVALID_IMPLICIT_EXT,
        CONFIG_3,
        `Implicit extension "${extension}" cannot be a path.`
      );
    }
    if (GLOB_PATTERN_CHARACTERS.test(extension)) {
      isFormatValid = false;
      addOutcome(
        extensionPath,
        CONSTRAINT_INVALID_IMPLICIT_EXT,
        CONFIG_3,
        `Implicit extension "${extension}" cannot contain pattern characters.`
      );
    }
    if (FORBIDDEN_CODE_EXTENSIONS.has(extension)) {
      isFormatValid = false;
      addOutcome(
        extensionPath,
        CONSTRAINT_INVALID_IMPLICIT_EXT,
        CONFIG_3,
        `Implicit extension "${extension}" cannot be a TypeScript or JavaScript code extension.`
      );
    }

    if (seenInRole.has(extension)) {
      addOutcome(
        extensionPath,
        CONSTRAINT_DUPLICATE_ELEMENT,
        CONFIG_2,
        `Duplicate implicit extension "${extension}" in the same role.`
      );
    } else {
      seenInRole.add(extension);
      if (isFormatValid) {
        extensionEntries.push({ extension, path: extensionPath, roleName });
      }
    }
  };

  const validateExtensions = (
    extensionList: unknown,
    rolePath: string,
    roleName: string,
    isCategoryNode: unknown
  ): void => {
    const listPath = `${rolePath}.implicitRoleExtensions`;
    if (!Array.isArray(extensionList)) {
      addOutcome(
        listPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "implicitRoleExtensions" must be an array.'
      );
      return;
    }
    if (extensionList.length === 0) {
      addOutcome(
        listPath,
        CONSTRAINT_EMPTY_LIST,
        CONFIG_3,
        'Property "implicitRoleExtensions" cannot be empty.'
      );
      return;
    }
    if (isCategoryNode === false) {
      addOutcome(
        `${rolePath}.isCategoryNode`,
        CONSTRAINT_CATEGORY_NODE_MISMATCH,
        CONFIG_3,
        'Role with implicit extensions cannot set isCategoryNode to false.'
      );
    }

    const seenInRole = new Set<string>();
    for (const [index, extensionItem] of extensionList.entries()) {
      validateExtensionItem(
        extensionItem,
        `${listPath}[${index}]`,
        roleName,
        seenInRole
      );
    }
  };

  const validateRoleFlags = (
    roleRecord: Record<string, unknown>,
    rolePath: string
  ): void => {
    if (
      'allowMultipleSymbols' in roleRecord &&
      roleRecord['allowMultipleSymbols'] !== undefined &&
      typeof roleRecord['allowMultipleSymbols'] !== 'boolean'
    ) {
      addOutcome(
        `${rolePath}.allowMultipleSymbols`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "allowMultipleSymbols" must be a boolean.'
      );
    }

    if (
      'isCategoryNode' in roleRecord &&
      roleRecord['isCategoryNode'] !== undefined &&
      typeof roleRecord['isCategoryNode'] !== 'boolean'
    ) {
      addOutcome(
        `${rolePath}.isCategoryNode`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "isCategoryNode" must be a boolean.'
      );
    }
  };

  const validateRoleScalars = (
    roleRecord: Record<string, unknown>,
    rolePath: string
  ): { category: null | string; name: null | string } => {
    let validName: null | string = null;
    if (!('name' in roleRecord)) {
      addOutcome(
        `${rolePath}.name`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_3,
        'Required property "name" is missing.'
      );
    } else if (typeof roleRecord['name'] !== 'string') {
      addOutcome(
        `${rolePath}.name`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "name" must be a string.'
      );
    } else if (roleRecord['name'].length === 0) {
      addOutcome(
        `${rolePath}.name`,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Property "name" cannot be empty.'
      );
    } else {
      validName = roleRecord['name'];
    }

    let validCategory: null | string = null;
    if (!('category' in roleRecord)) {
      addOutcome(
        `${rolePath}.category`,
        CONSTRAINT_MISSING_PROPERTY,
        CONFIG_3,
        'Required property "category" is missing.'
      );
    } else if (typeof roleRecord['category'] !== 'string') {
      addOutcome(
        `${rolePath}.category`,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Property "category" must be a string.'
      );
    } else if (roleRecord['category'].length === 0) {
      addOutcome(
        `${rolePath}.category`,
        CONSTRAINT_EMPTY_STRING,
        CONFIG_2,
        'Property "category" cannot be empty.'
      );
    } else {
      validCategory = roleRecord['category'];
    }

    validateRoleFlags(roleRecord, rolePath);

    return { category: validCategory, name: validName };
  };

  const validateSingleRole = (
    roleRecord: Record<string, unknown>,
    rolePath: string
  ): void => {
    checkUnknownAndNil(roleRecord, rolePath);
    const { category, name } = validateRoleScalars(roleRecord, rolePath);

    if (name !== null && category !== null) {
      roleEntries.push({ category, name, path: rolePath });
    }

    if (
      'implicitRoleExtensions' in roleRecord &&
      roleRecord['implicitRoleExtensions'] !== undefined
    ) {
      validateExtensions(
        roleRecord['implicitRoleExtensions'],
        rolePath,
        name ?? '',
        roleRecord['isCategoryNode']
      );
    }
  };

  const validateGroupItem = (subItem: unknown, subItemPath: string): void => {
    if (subItem === null) {
      addOutcome(
        subItemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Role element cannot be null.'
      );
      return;
    }
    if (Array.isArray(subItem)) {
      addOutcome(
        subItemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_3,
        'Further nesting of role groups is forbidden.'
      );
      return;
    }
    if (!isPlainRecord(subItem)) {
      addOutcome(
        subItemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Role element must be an object.'
      );
      return;
    }
    validateSingleRole(subItem, subItemPath);
  };

  const validateRoleItem = (item: unknown, itemPath: string): void => {
    if (item === null) {
      addOutcome(
        itemPath,
        CONSTRAINT_NULL_FORBIDDEN,
        CONFIG_2,
        'Role element cannot be null.'
      );
      return;
    }
    if (Array.isArray(item)) {
      if (item.length === 0) {
        addOutcome(
          itemPath,
          CONSTRAINT_EMPTY_LIST,
          CONFIG_3,
          'Role group cannot be empty.'
        );
      } else {
        for (const [subIndex, subItem] of item.entries()) {
          validateGroupItem(subItem, `${itemPath}[${subIndex}]`);
        }
      }
      return;
    }
    if (!isPlainRecord(item)) {
      addOutcome(
        itemPath,
        CONSTRAINT_INVALID_TYPE,
        CONFIG_2,
        'Role element must be an object.'
      );
      return;
    }
    validateSingleRole(item, itemPath);
  };

  for (const [index, roleItem] of roles.entries()) {
    validateRoleItem(roleItem, `${rolesPath}[${index}]`);
  }

  return { extensionEntries, roleEntries };
}
