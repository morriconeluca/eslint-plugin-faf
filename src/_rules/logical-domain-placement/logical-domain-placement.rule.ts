import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { walkAncestors } from '#_rules@shared/_utils/_systems/walk-ancestors/index.js';

/**
 * @fileoverview Rule: faf/logical-domain-placement
 * Enforces the FAF topological placement constraints between Logical Domains.
 *
 * FAF Law:
 * - Root Fragments may only be placed inside a Root Container or another Root Fragment.
 * - Layers cannot reside within Fragments and cannot contain files/Fragments directly,
 *   except the terminal Layer of a configured Route Hierarchy.
 * - Fragments cannot be nested directly inside a Layer, another Fragment, a Fractal Branch,
 *   or a nested Root Fragment; they must be contained within a Category.
 * - Fractal Branches cannot be nested inside another Fractal Branch and cannot contain
 *   files directly.
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

        for (const {
          folderName: currentFolderName,
          parentDir: relParentDir,
          parentFolderName,
          parentType: relParentType,
          type: currentType,
        } of walkAncestors(relDir, config)) {
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
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce topological placement constraints between FAF Logical Domains',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
