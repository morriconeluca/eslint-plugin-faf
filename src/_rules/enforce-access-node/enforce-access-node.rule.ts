import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getProjectRoot } from '#_rules@shared/_utils/_primitives/get-project-root/index.js';
import { getRootFragmentConfig } from '#_rules@shared/_utils/_primitives/get-root-fragment-config/index.js';
import { readDirCached } from '#_rules@shared/_utils/_primitives/read-dir-cached/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';
import { walkAncestors } from '#_rules@shared/_utils/_systems/walk-ancestors/index.js';

/**
 * @fileoverview Rule: faf/enforce-access-node
 * Enforces the FAF Law of Access Node Integrity.
 *
 * FAF Law:
 * - A directory that isn't a Category, Layer, Fractal Branch, or Root Fragment must have
 *   an Access Node (index.ts/index.js).
 * - Access Nodes are exclusive to Fragments: an index file directly inside any other
 *   Logical Domain is forbidden.
 * - Every Fragment must contain at least one Fragment Node establishing its Master Node.
 * - An Access Node (barrel file like `index.ts`) must only define and export the Fragment's
 *   public interface. It is restricted to import/export only its own sibling Fragment Nodes
 *   using simple relative paths.
 *
 * Valid:
 * - `export * from './button.component';` inside `button/index.ts`.
 * - `export type * from './button.type';` inside `button/index.ts`.
 *
 * Invalid:
 * - Importing/exporting files from subfolders (e.g. `export * from './_components/child';`).
 * - Importing/exporting files from parent folders or external paths (e.g. `export * from '../utils';`).
 * - Exporting files that do not share the parent Fragment's name prefix.
 */
const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const settings = context.settings as { faf?: TFafSettings };

    const listeners: Rule.RuleListener = {
      Program(node) {
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
          type: currentType,
        } of walkAncestors(relDir, config)) {
          if (currentType === 'invalid-fragment') {
            context.report({
              message: `Fragment directory "${currentFolderName}" is missing an Access Node (index.ts/index.js).`,
              node,
            });
          }
        }

        if (
          parentType === 'layer' ||
          parentType === 'fractal-branch' ||
          parentType === 'invalid-fragment'
        ) {
          return;
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

        if (fileName !== 'index.ts' && fileName !== 'index.js') {
          return;
        }

        if (parentType !== 'fragment') {
          context.report({
            message: `Access Nodes ("index.ts/index.js") are exclusive to Fragments. Found index file directly inside "${folderName}" (classified as ${parentType}).`,
            node,
          });
          return;
        }

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
      },
    };

    const fileName = path.basename(relPath);
    if (fileName !== 'index.ts' && fileName !== 'index.js') {
      return listeners;
    }
    if (!settings.faf) {
      return listeners;
    }

    const config = findTreeConfig(relPath, settings.faf);
    if (!config) {
      return listeners;
    }

    const relDir = path.dirname(relPath);
    const parentType = classifyFolder(relDir, config);

    // If it's not a Fragment, the checks above already report it
    if (parentType !== 'fragment') {
      return listeners;
    }

    function checkSource(node: Rule.Node, sourceVal: string) {
      // Matches only "./filename" with no further "/" (no subfolders, no parent folders)
      const isValidSibling = /^\.\/[^/]+$/.test(sourceVal);
      if (!isValidSibling) {
        context.report({
          message: `Access Node (index file) can only import or export its own sibling Fragment Nodes using simple relative paths (e.g. "./example.component"). Got "${sourceVal}".`,
          node,
        });
        return;
      }

      const importedFilename = path.basename(sourceVal);
      if (
        importedFilename === 'index' ||
        importedFilename === 'index.ts' ||
        importedFilename === 'index.js' ||
        importedFilename === 'README.md' ||
        importedFilename === 'package.json'
      ) {
        return;
      }

      const fragmentName = path.basename(relDir);
      if (!importedFilename.startsWith(fragmentName + '.')) {
        context.report({
          message: `Access Node (index file) can only re-export its own Fragment Nodes (names starting with "${fragmentName}."). Got "${importedFilename}".`,
          node,
        });
      }
    }

    listeners.ExportAllDeclaration = (node) => {
      checkSource(node, node.source.value as string);
    };
    listeners.ExportNamedDeclaration = (node) => {
      if (node.source) {
        checkSource(node, node.source.value as string);
      }
    };
    listeners.ImportDeclaration = (node) => {
      checkSource(node, node.source.value as string);
    };

    return listeners;
  },
  meta: {
    docs: {
      description: 'Enforce Access Node integrity for Fragments',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
