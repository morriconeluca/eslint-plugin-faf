import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getCategoryConfig } from '#_rules@shared/_utils/_primitives/get-category-config/index.js';
import { getFileRole } from '#_rules@shared/_utils/_primitives/get-file-role/index.js';
import { getProjectRoot } from '#_rules@shared/_utils/_primitives/get-project-root/index.js';
import { getRootFragmentConfig } from '#_rules@shared/_utils/_primitives/get-root-fragment-config/index.js';
import { readDirCached } from '#_rules@shared/_utils/_primitives/read-dir-cached/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { walkAncestors } from '#_rules@shared/_utils/_systems/walk-ancestors/index.js';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * @fileoverview Rule: faf/naming-conventions
 * Enforces pure lexical FAF naming conventions.
 *
 * FAF Law:
 * - Folders and files in the logical domain must use kebab-case.
 * - Layers/Categories/Sub-Categories must be prefixed with an underscore (e.g. `_components`).
 * - Fragments/Sub-Fragments/Root Fragments must NOT be prefixed with an underscore.
 * - A Fractal Branch's name must match its parent scope: `_<Scope>@shared`.
 * - A Logical Node's name admits exactly one Role segment.
 */
const rule: Rule.RuleModule = {
  create(context) {
    return {
      Program(node) {
        const absPath = context.filename;
        const relPath = toRelativePath(absPath);
        const settings = context.settings as { faf?: TFafSettings };

        if (!settings.faf) {
          return;
        }

        const config = findTreeConfig(relPath, settings.faf);
        if (!config) {
          return;
        }

        const relDir = path.dirname(relPath);
        const parentType = classifyFolder(relDir, config);

        if (parentType === 'foreign') {
          return;
        }

        const fileName = path.basename(relPath);

        // Validate folder conventions across all ancestors, not just the immediate parent
        for (const {
          dir: currentDir,
          folderName: currentFolderName,
          type: currentType,
        } of walkAncestors(relDir, config)) {
          // Layers and Categories must be prefixed with an underscore
          if (
            (currentType === 'layer' || currentType === 'category') &&
            !currentFolderName.startsWith('_')
          ) {
            context.report({
              message: `Layer/Category directory "${currentFolderName}" must be prefixed with an underscore (e.g. "_${currentFolderName}").`,
              node,
            });
          }

          // Fragments must NOT be prefixed with an underscore
          if (
            currentFolderName.startsWith('_') &&
            !currentFolderName.includes('@shared')
          ) {
            const contents = readDirCached(currentDir);
            const hasIndex =
              contents.files.includes('index.ts') ||
              contents.files.includes('index.js');
            if (hasIndex) {
              context.report({
                message: `Directory "${currentFolderName}" has an Access Node (index.ts) but its name starts with "_". Fragments must not be prefixed with underscore.`,
                node,
              });
            }
          }

          if (currentFolderName !== 'src') {
            let baseFolderName = currentFolderName.replace(/@shared$/, '');
            if (baseFolderName.startsWith('_')) {
              baseFolderName = baseFolderName.substring(1);
            }
            if (
              baseFolderName.startsWith('[') &&
              baseFolderName.endsWith(']')
            ) {
              baseFolderName = baseFolderName.substring(
                1,
                baseFolderName.length - 1
              );
            }
            const isKebab = KEBAB_CASE_REGEX.test(baseFolderName);
            if (!isKebab) {
              context.report({
                message: `Folder name "${currentFolderName}" must be in kebab-case (e.g. "_my-folder" or "_[my-param]").`,
                node,
              });
            }
          }

          if (currentType === 'fractal-branch') {
            const expectedScope = path.basename(path.dirname(currentDir));
            const normalizedExpectedScope = expectedScope.startsWith('_')
              ? expectedScope.substring(1)
              : expectedScope;
            const expectedName = `_${normalizedExpectedScope}@shared`;
            if (currentFolderName !== expectedName) {
              context.report({
                message: `Fractal Branch name "${currentFolderName}" must match its parent scope name: "${expectedName}".`,
                node,
              });
            }
          }
        }

        // Placement and Access Node integrity are handled by logical-domain-placement
        // and enforce-access-node; only lexical checks continue past this point
        if (
          parentType === 'layer' ||
          parentType === 'fractal-branch' ||
          parentType === 'invalid-fragment'
        ) {
          return;
        }

        // A Root Fragment's internal naming (including role suffixes) is governed by
        // "rootNodes", not by the ordinary Logical Node role conventions
        const rfConfig = getRootFragmentConfig(relDir, config);
        if (rfConfig) {
          const flatRootNodes = rfConfig.rootNodes.flat();
          const isMatchedRootNode = flatRootNodes.some((rn) => {
            if (rn.includes('/')) {
              const rfPath = rfConfig.paths[0] ?? '';
              const absRn = path.resolve(getProjectRoot(), rfPath, rn);
              return toRelativePath(absRn) === relPath;
            }
            return rn === fileName;
          });

          if (isMatchedRootNode) {
            return; // Valid Root Node
          }
        }

        if (fileName === 'index.ts' || fileName === 'index.js') {
          return; // Access Node, handled by enforce-access-node
        }

        if (
          fileName === 'README.md' ||
          fileName === 'package.json' ||
          fileName === 'tsconfig.json'
        ) {
          return;
        }

        const role = getFileRole(fileName, config);
        const ext = path.extname(fileName);

        // A Logical Node's name admits exactly one Role segment
        const allRoleNames = new Set(config.roles.flat());
        const roleSegments = fileName
          .slice(0, fileName.length - ext.length)
          .split('.')
          .slice(1)
          .filter((part) => allRoleNames.has(part));
        const multiRoleMessage = `File "${fileName}" composes multiple Roles ("${roleSegments.join('", "')}") in its name. A Logical Node may declare only one Role; promote the detail that needs its own Role to an autonomous Sub-Fragment.`;

        if (parentType === 'fragment' && role && roleSegments.length > 1) {
          context.report({ message: multiRoleMessage, node });
        }

        if (parentType === 'category') {
          const folderName = path.basename(relDir);
          const catConfig = getCategoryConfig(relDir, config);
          if (catConfig) {
            const allowedExts = catConfig.allowedExtensions ?? [
              '.js',
              '.jsx',
              '.ts',
              '.tsx',
            ];
            if (!allowedExts.includes(ext)) {
              context.report({
                message: `File extension "${ext}" is not allowed in Category "${folderName}". Allowed extensions: ${allowedExts.join(', ')}.`,
                node,
              });
              return;
            }

            const isCodeExt = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
            if (isCodeExt) {
              if (!role) {
                context.report({
                  message: `Logical Node "${fileName}" inside Category "${folderName}" must have a role suffix.`,
                  node,
                });
              } else if (role !== catConfig.role) {
                context.report({
                  message: `Role "${role}" for file "${fileName}" does not match the expected Category role "${catConfig.role}".`,
                  node,
                });
              } else if (roleSegments.length > 1) {
                context.report({ message: multiRoleMessage, node });
              }
            } else {
              // Asset files
              if (role && role !== catConfig.role) {
                context.report({
                  message: `Role "${role}" for asset "${fileName}" does not match the expected Category role "${catConfig.role}".`,
                  node,
                });
              } else if (role && roleSegments.length > 1) {
                context.report({ message: multiRoleMessage, node });
              }
            }
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce lexical naming conventions for FAF folders and Logical Nodes',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
