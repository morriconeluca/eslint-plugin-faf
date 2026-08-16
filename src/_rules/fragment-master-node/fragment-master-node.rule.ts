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
 * @fileoverview Rule: faf/fragment-master-node
 * Enforces the FAF Law of Fragment Node identity and Master Node integrity.
 *
 * FAF Law:
 * - Fragment Nodes must share the parent Fragment's name.
 * - A Role suffix is mandatory and must be unique among the Fragment Nodes of the same Fragment.
 * - A Fragment placed under a Category (or terminating a Route Hierarchy) must contain a
 *   Master Node carrying the Role imposed by that Category/Route.
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

        if (parentType !== 'fragment') {
          return;
        }

        const fileName = path.basename(relPath);

        // Must run before the role checks below: a Root Fragment's internal naming
        // (which never applies here since parentType is 'fragment') is irrelevant, but a
        // configured Root Node sitting directly inside this Fragment's own path is not
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

        const allRoleNames = new Set(config.roles.flat());
        const roleSegments = fileName
          .slice(0, fileName.length - ext.length)
          .split('.')
          .slice(1)
          .filter((part) => allRoleNames.has(part));

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

          const httpMethods = matchedRoute.httpMethods ?? DEFAULT_HTTP_METHODS;
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
          const currentParentType = classifyFolder(currentParent, config);
          if (currentParentType === 'category') {
            categoryConfig = getCategoryConfig(currentParent, config);
            categoryFolderName = path.basename(currentParent);
            break;
          } else if (
            currentParentType === 'fragment' ||
            currentParentType === 'root-fragment' ||
            currentParentType === 'layer'
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

        // Every Fragment Node must have a role, even if it has a whitelisted extension
        if (!role) {
          context.report({
            message: `File "${fileName}" inside Fragment "${folderName}" must have an explicit role suffix (e.g. "${folderName}.style${ext}").`,
            node,
          });
        } else if (roleSegments.length > 1) {
          // Composing multiple Roles in one name is reported by naming-conventions
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
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce Fragment Node identity and Master Node integrity in FAF Fragments',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
