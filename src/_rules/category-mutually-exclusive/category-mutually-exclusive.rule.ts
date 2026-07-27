import type { Rule } from 'eslint';

import path from 'path';

import type { TFafSettings } from '#_rules@shared/_types/faf.type.js';

import { classifyFolder } from '#_rules@shared/_utils/_aggregates/classify-folder/index.js';
import { findTreeConfig } from '#_rules@shared/_utils/_primitives/find-tree-config/index.js';
import { getCategoryConfig } from '#_rules@shared/_utils/_primitives/get-category-config/index.js';
import { readDirCached } from '#_rules@shared/_utils/_primitives/read-dir-cached/index.js';
import { toRelativePath } from '#_rules@shared/_utils/_primitives/to-relative-path/index.js';

/**
 * @fileoverview Rule: faf/category-mutually-exclusive
 * Enforces the FAF rule of Category Purity (Mutua Esclusività).
 *
 * FAF Law: Categories must contain either ONLY single files (Logical Nodes) or ONLY subfolders (Fragments).
 *
 * Valid:
 * - A category configured with `allowSingleFiles: true` containing only files (e.g. `_types/user.type.ts`).
 * - A category configured with `allowSingleFiles: false` containing only Fragment folders (e.g. `_utils/get-path/`).
 *
 * Invalid:
 * - Mixing single files and subfolders directly inside the same category directory.
 * - Placing files directly in a Category that is not configured to allow single files (`allowSingleFiles: false`).
 */
const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const settings = context.settings as { faf?: TFafSettings };

    if (!settings.faf) {
      return {};
    }

    const config = findTreeConfig(relPath, settings.faf);
    if (!config) {
      return {};
    }

    const relDir = path.dirname(relPath);
    const parentType = classifyFolder(relDir, config);

    // This check runs once per directory. To avoid reporting multiple times, we only run it on the Access Node or the first file processed in the directory.
    if (parentType !== 'category') {
      return {};
    }

    const fileName = path.basename(relPath);

    return {
      Program(node) {
        const contents = readDirCached(relDir);

        // Filter contents to ignore doc files, config files, and Fractal Branches
        const activeFiles = contents.files.filter(
          (f) => f !== 'README.md' && f !== 'package.json' && !f.startsWith('.')
        );
        const activeDirs = contents.dirs.filter((d) => !d.startsWith('_')); // Ignore sub-categories/layers/fractal branches

        const hasFiles = activeFiles.length > 0;
        const hasDirs = activeDirs.length > 0;

        if (hasFiles && hasDirs) {
          context.report({
            loc: { column: 0, line: 1 },
            message: `Mutua Esclusività violation in Category "${path.basename(relDir)}": cannot mix single files (${activeFiles.join(', ')}) and Fragment directories (${activeDirs.join(', ')}).`,
            node,
          });
        }

        // Also check if category config allows single files
        if (hasFiles) {
          const folderName = path.basename(relDir);
          const catConfig = getCategoryConfig(relDir, config);
          if (catConfig) {
            const ext = path.extname(fileName);
            const isAllowedAsset =
              catConfig.allowedExtensions?.includes(ext) ?? false;
            if (!catConfig.allowSingleFiles && !isAllowedAsset) {
              context.report({
                message: `Category "${folderName}" cannot contain file nodes directly. File "${fileName}" must be encapsulated inside a Fragment.`,
                node,
              });
            }
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce that Categories contain either only file nodes or only Fragment folders, and check whitelist roles',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
