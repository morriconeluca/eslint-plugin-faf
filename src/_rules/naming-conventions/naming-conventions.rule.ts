import type { Rule } from 'eslint';

import path from 'path';

import type {
  TFafSettings,
  THttpMethod,
} from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getCategoryConfig } from '#_rules@shared/_utils/_primitives/get-category-config/index.js';
import { getFileRole } from '#_rules@shared/_utils/_primitives/get-file-role/index.js';
import { getProjectRoot } from '#_rules@shared/_utils/_primitives/get-project-root/index.js';
import { getRootFragmentConfig } from '#_rules@shared/_utils/_primitives/get-root-fragment-config/index.js';
import { readDirCached } from '#_rules@shared/_utils/_primitives/read-dir-cached/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DEFAULT_HTTP_METHODS: THttpMethod[] = [
  'connect',
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
];

/**
 * @fileoverview Rule: faf/naming-conventions
 * Enforces FAF folder taxonomy, naming conventions, and file role suffixes.
 *
 * FAF Law:
 * - Folders and files in the logical domain must use kebab-case.
 * - Categories/Layers must start with an underscore (e.g. `_components`).
 * - Fragments must NOT start with an underscore.
 * - Sibling Fragment Nodes must share the parent Fragment folder's name.
 * - All logical nodes must end with a valid role suffix (e.g. `[name].[role].ts`).
 * - Fragments placed under a Category (or Route) must contain a Master Node with the corresponding role.
 * - Every Fragment must have a Master Node, and Fragment Nodes must have unique Roles.
 * - A route terminal Fragment's name must follow the "<method>-<object>" pattern.
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
        const folderName = path.basename(relDir);
        const parentType = classifyFolder(relDir, config);

        if (parentType === 'foreign') {
          return;
        }

        const fileName = path.basename(relPath);

        // Validate folder conventions across all ancestors, not just the immediate parent
        let currentDir = relDir;
        while (currentDir && currentDir !== '.' && currentDir !== '/') {
          const isInTree = config.includes.some(
            (inc) => currentDir === inc || currentDir.startsWith(inc + '/')
          );
          const isExcluded =
            config.excludes?.some(
              (exc) => currentDir === exc || currentDir.startsWith(exc + '/')
            ) ?? false;

          if (!isInTree || isExcluded) {
            break;
          }

          const currentFolderName = path.basename(currentDir);
          const currentType = classifyFolder(currentDir, config);

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

          if (currentType === 'invalid-fragment') {
            context.report({
              message: `Fragment directory "${currentFolderName}" is missing an Access Node (index.ts/index.js).`,
              node,
            });
          }

          const relParentDir = path.dirname(currentDir).replace(/\\/g, '/');
          const parentFolderName = path.basename(relParentDir);
          // 'unknown' means relParentDir falls outside any configured tree path,
          // i.e. it is the literal Root Container
          const relParentType =
            relParentDir === '.' || relParentDir === '/'
              ? 'unknown'
              : classifyFolder(relParentDir, config);

          if (currentType === 'root-fragment') {
            if (
              relParentType !== 'root-fragment' &&
              relParentType !== 'unknown'
            ) {
              context.report({
                message: `Root Fragment directory "${currentFolderName}" must be placed directly inside a Root Container or another Root Fragment, not inside "${parentFolderName}" (classified as ${relParentType}).`,
                node,
              });
            }
          }

          if (currentType === 'layer') {
            if (
              relParentType === 'fragment' ||
              relParentType === 'invalid-fragment'
            ) {
              context.report({
                message: `Layer directory "${currentFolderName}" cannot be placed inside "${parentFolderName}" (classified as ${relParentType}). Layers cannot reside within Fragments.`,
                node,
              });
            }
          }

          // A Fragment cannot be placed directly:
          // - under a Layer (unless it terminates a configured Route Hierarchy)
          // - inside another Fragment (must be nested within a Private Category)
          // - inside a Fractal Branch
          // - inside a nested Root Fragment (must be contained within a Category)
          if (
            currentType === 'fragment' ||
            currentType === 'invalid-fragment'
          ) {
            const isParentRootContainer =
              config.includes.includes(relParentDir);
            if (relParentType === 'layer') {
              const isParentRoute =
                config.routeHierarchies &&
                config.routeHierarchies.some((rh) =>
                  rh.paths.some(
                    (rp) =>
                      relParentDir === rp || relParentDir.startsWith(rp + '/')
                  )
                );
              if (!isParentRoute) {
                context.report({
                  message: `Fragment directory "${currentFolderName}" cannot be placed directly inside Layer "${parentFolderName}". Fragments must be contained within a Category.`,
                  node,
                });
              }
            } else if (
              relParentType === 'fragment' ||
              relParentType === 'invalid-fragment'
            ) {
              context.report({
                message: `Fragment directory "${currentFolderName}" cannot be placed directly inside Fragment "${parentFolderName}". Sub-Fragments must be contained within a Private Category.`,
                node,
              });
            } else if (relParentType === 'fractal-branch') {
              context.report({
                message: `Fragment directory "${currentFolderName}" cannot be placed directly inside Fractal Branch "${parentFolderName}". Fragments must be contained within a Category.`,
                node,
              });
            } else if (
              relParentType === 'root-fragment' &&
              !isParentRootContainer
            ) {
              context.report({
                message: `Fragment directory "${currentFolderName}" cannot be placed directly inside Root Fragment "${parentFolderName}". Fragments must be contained within a Category.`,
                node,
              });
            }
          }

          if (currentType === 'fractal-branch') {
            if (relParentType === 'fractal-branch') {
              context.report({
                message: `Fractal Branch "${currentFolderName}" cannot be placed inside another Fractal Branch "${parentFolderName}".`,
                node,
              });
            }
          }

          currentDir = path.dirname(currentDir).replace(/\\/g, '/');
        }

        if (parentType === 'layer') {
          context.report({
            message: `Layers cannot contain files directly. File "${fileName}" is placed directly inside Layer "${folderName}".`,
            node,
          });
          return;
        }

        if (parentType === 'fractal-branch') {
          context.report({
            message: `Fractal Branches cannot contain files directly. File "${fileName}" is placed directly inside Fractal Branch "${folderName}".`,
            node,
          });
          return;
        }

        if (parentType === 'invalid-fragment') {
          return; // Already reported by ancestor loop
        }

        // Must run before the Access Node check below: a Root Fragment's internal
        // naming (including a file named "index.ts") is governed by "rootNodes", not
        // by the ordinary Fragment taxonomy
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
          if (parentType !== 'fragment') {
            context.report({
              message: `Access Nodes ("index.ts/index.js") are exclusive to Fragments. Found index file directly inside "${folderName}" (classified as ${parentType}).`,
              node,
            });
          } else {
            const contents = readDirCached(relDir);
            const hasFragmentNode = contents.files.some(
              (f) =>
                f !== 'index.ts' &&
                f !== 'index.js' &&
                f !== 'README.md' &&
                f !== 'package.json' &&
                f !== 'tsconfig.json'
            );
            if (!hasFragmentNode) {
              context.report({
                message: `Fragment "${folderName}" has no Master Node. Every Fragment must contain at least one Fragment Node establishing its Role.`,
                node,
              });
            }
          }
          return;
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

        if (parentType === 'fragment') {
          // Check route hierarchy role constraint
          const matchedRoute = config.routeHierarchies?.find((rh) =>
            rh.paths.some((rp) => relDir === rp || relDir.startsWith(rp + '/'))
          );
          if (matchedRoute) {
            const contents = readDirCached(relDir);
            const fileRoles = contents.files.map((f) => getFileRole(f, config));
            if (!fileRoles.includes(matchedRoute.role)) {
              context.report({
                message: `Route terminal Fragment "${folderName}" must contain a Master Node with role "${matchedRoute.role}" (e.g. "${folderName}.${matchedRoute.role}.ts").`,
                node,
              });
            }

            const httpMethods =
              matchedRoute.httpMethods ?? DEFAULT_HTTP_METHODS;
            const routeNameRegex = new RegExp(
              `^(${httpMethods.join('|')})-[a-z0-9]+(-[a-z0-9]+)*$`
            );
            if (!routeNameRegex.test(folderName)) {
              context.report({
                message: `Route terminal Fragment "${folderName}" must follow the "<method>-<object>" pattern with a lowercase HTTP method (${httpMethods.join(', ')}).`,
                node,
              });
            }
          }

          // Check category role constraint
          let currentParent = path.dirname(relDir).replace(/\\/g, '/');
          let categoryConfig = null;
          let categoryFolderName = '';
          while (
            currentParent &&
            currentParent !== '.' &&
            currentParent !== '/'
          ) {
            const parentType = classifyFolder(currentParent, config);
            if (parentType === 'category') {
              categoryConfig = getCategoryConfig(currentParent, config);
              categoryFolderName = path.basename(currentParent);
              break;
            } else if (
              parentType === 'fragment' ||
              parentType === 'root-fragment' ||
              parentType === 'layer'
            ) {
              break;
            }
            const nextParent = path.dirname(currentParent).replace(/\\/g, '/');
            if (nextParent === currentParent) break;
            currentParent = nextParent;
          }

          if (categoryConfig && categoryConfig.role) {
            const contents = readDirCached(relDir);
            const fileRoles = contents.files.map((f) => getFileRole(f, config));
            if (!fileRoles.includes(categoryConfig.role)) {
              context.report({
                message: `Fragment "${folderName}" inside Category "${categoryFolderName}" must contain a Master Node with role "${categoryConfig.role}" (e.g. "${folderName}.${categoryConfig.role}.ts").`,
                node,
              });
            }
          }

          if (!fileName.startsWith(folderName + '.')) {
            context.report({
              message: `Fragment Node "${fileName}" must share the parent Fragment name: "${folderName}.<role>${ext}".`,
              node,
            });
          }

          // In a Fragment, ALL files must have a role, even if they have whitelisted extensions
          if (!role) {
            context.report({
              message: `File "${fileName}" inside Fragment "${folderName}" must have an explicit role suffix (e.g. "${folderName}.style${ext}").`,
              node,
            });
          } else if (roleSegments.length > 1) {
            context.report({ message: multiRoleMessage, node });
          } else {
            const contents = readDirCached(relDir);
            // Exclude the Access Node: it always resolves to role 'index', which a
            // Fragment Node could otherwise also carry via an explicit ".index" suffix
            const duplicate = contents.files.find(
              (f) =>
                f !== fileName &&
                f !== 'index.ts' &&
                f !== 'index.js' &&
                getFileRole(f, config) === role
            );
            if (duplicate) {
              context.report({
                message: `Fragment Node "${fileName}" shares Role "${role}" with sibling "${duplicate}". Each Fragment Node must have a unique Role within its Fragment.`,
                node,
              });
            }
          }
        }

        if (parentType === 'category') {
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
        'Enforce naming conventions and folder taxonomy in FAF architecture',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
