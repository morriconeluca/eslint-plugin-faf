import type { Rule } from 'eslint';

import path from 'path';

import {
  classifyFolder,
  findTreeConfigIncludingExcluded,
  getFileRole,
  getLcaAndSubBranches,
  getRoleHierarchyIndex,
  getRootFragmentConfig,
  readDirCached,
  resolveHorizontalHierarchy,
  resolveImportPath,
  type TFafSettings,
  toRelativePath,
  type TRootFragmentConfig,
  type TTreeConfig,
} from '#_rules@shared/_utils/context/index.js';

function getDirectoryRole(dirPath: string, config: TTreeConfig): null | string {
  const folderName = path.basename(dirPath);
  if (folderName.startsWith('_')) {
    return getRoleFromFolderName(folderName, config);
  }
  const contents = readDirCached(dirPath);
  for (const file of contents.files) {
    if (file.startsWith(folderName + '.')) {
      const role = getFileRole(file, config);
      if (role) return role;
    }
  }
  return null;
}

function getRoleFromFolderName(
  name: string,
  config: TTreeConfig
): null | string {
  const catConfig = config.categories?.find((c) => c.name === name);
  return catConfig ? (catConfig.role ?? null) : null;
}

function getRootNodeIndex(
  relPath: string,
  rfConfig: TRootFragmentConfig,
  lcaPath: string
): number {
  const relToLca = path.relative(lcaPath, relPath).replace(/\\/g, '/');
  for (let i = 0; i < rfConfig.rootNodes.length; i++) {
    const group = rfConfig.rootNodes[i];
    if (group && group.includes(relToLca)) {
      return i;
    }
  }
  return -1;
}

/**
 * Checks if B is inside a Private Category of the LCA directory.
 */
function isInsidePrivateCategoryOfLca(
  relPathB: string,
  lcaPath: string,
  config: TTreeConfig
): boolean {
  let current = relPathB;
  while (current && current !== '.' && current !== '/' && current !== lcaPath) {
    const parent = path.dirname(current).replace(/\\/g, '/');
    if (parent === current) {
      break;
    }

    const currentType = classifyFolder(current, config);
    const parentType = classifyFolder(parent, config);

    if (
      currentType === 'category' &&
      (parentType === 'fragment' || parentType === 'root-fragment') &&
      parent === lcaPath
    ) {
      return true;
    }

    current = parent;
  }
  return false;
}

const rule: Rule.RuleModule = {
  create(context) {
    const absPath = context.filename;
    const relPath = toRelativePath(absPath);
    const settings = context.settings as { faf?: TFafSettings };

    if (!settings.faf) {
      return {};
    }

    const config = findTreeConfigIncludingExcluded(relPath, settings.faf);
    if (!config) {
      return {};
    }

    const currentDir = path.dirname(relPath);
    const isCurrentFileExcluded =
      config.excludes?.some(
        (exc) => relPath === exc || relPath.startsWith(exc + '/')
      ) ?? false;

    function checkImport(node: Rule.Node, importValue: string) {
      const resolvedRelPath = resolveImportPath(
        importValue,
        relPath,
        settings.faf!
      );
      if (!resolvedRelPath) {
        return; // External import
      }

      const isImportedFileExcluded =
        config?.excludes?.some(
          (exc) =>
            resolvedRelPath === exc || resolvedRelPath.startsWith(exc + '/')
        ) ?? false;

      // Case A (Logical Node ➔ Foreign Domain)
      if (!isCurrentFileExcluded && isImportedFileExcluded) {
        context.report({
          message: `Importing from Foreign Domain "${resolvedRelPath}" is forbidden for Logical Nodes.`,
          node,
        });
        return;
      }

      // Case B (Foreign Domain ➔ Logical Node)
      if (isCurrentFileExcluded && !isImportedFileExcluded) {
        context.report({
          message: `Foreign Domain files cannot import Logical Nodes from FAF tree ("${resolvedRelPath}").`,
          node,
        });
        return;
      }

      // If either is excluded, do not run further peer dependency checks
      if (isCurrentFileExcluded || isImportedFileExcluded) {
        return;
      }

      const importedDir = path.dirname(resolvedRelPath);

      // Scenario 1: Same directory (Fragment Nodes or direct siblings)
      if (currentDir === importedDir) {
        const fileA = path.basename(relPath);
        const fileB = path.basename(resolvedRelPath);

        const roleA = getFileRole(fileA, config!);
        const roleB = getFileRole(fileB, config!);

        if (roleA && roleB) {
          const idxA = getRoleHierarchyIndex(roleA, config!);
          const idxB = getRoleHierarchyIndex(roleB, config!);

          if (idxA !== -1 && idxB !== -1) {
            if (idxB >= idxA) {
              context.report({
                message: `Sibling import violation: "${fileA}" (role "${roleA}", level ${idxA}) cannot import from "${fileB}" (role "${roleB}", level ${idxB}). Imports must flow from lower to higher levels.`,
                node,
              });
            }
          }
        }
        return;
      }

      // Scenario 2: Different directories
      const lcaInfo = getLcaAndSubBranches(currentDir, importedDir);
      if (!lcaInfo) {
        return;
      }

      const { lca, subA, subB } = lcaInfo;

      // Exception: Fractal Branch
      if (subB.startsWith('_') && subB.includes('@shared')) {
        // Allowed to import from own Fractal Branch
        return;
      }

      // Exception: Private Category of the LCA
      if (isInsidePrivateCategoryOfLca(importedDir, lca, config!)) {
        return;
      }

      // Exception: Descendants of a Fragment importing from the Fragment's root
      if (subB === '' && classifyFolder(lca, config!) === 'fragment') {
        return;
      }

      // Check if LCA is a Root Fragment and we are importing between Root Nodes
      const rfConfig = getRootFragmentConfig(lca, config!);
      if (rfConfig) {
        const idxRootA = getRootNodeIndex(relPath, rfConfig, lca);
        const idxRootB = getRootNodeIndex(resolvedRelPath, rfConfig, lca);

        if (idxRootA !== -1 && idxRootB !== -1) {
          if (idxRootB >= idxRootA) {
            context.report({
              message: `Root Node import violation: "${path.basename(relPath)}" cannot import from "${path.basename(resolvedRelPath)}" under Root Fragment "${lca}".`,
              node,
            });
          }
          return;
        }
      }

      // Determine if there is a defined horizontal hierarchy at LCA and whether the import is allowed
      const { allowed, defined: hasDefinedHierarchy } =
        resolveHorizontalHierarchy(lca, subA, subB, config!);

      if (hasDefinedHierarchy) {
        if (!allowed) {
          context.report({
            message: `Horizontal hierarchy violation: "${subA}" cannot import from "${subB}" under parent "${lca}".`,
            node,
          });
        }
      } else {
        // Fallback to role-based hierarchy comparison
        const roleA = getDirectoryRole(path.posix.join(lca, subA), config!);
        const roleB = getDirectoryRole(path.posix.join(lca, subB), config!);

        const idxA = roleA ? getRoleHierarchyIndex(roleA, config!) : -1;
        const idxB = roleB ? getRoleHierarchyIndex(roleB, config!) : -1;

        if (idxA !== -1 && idxB !== -1) {
          if (idxB >= idxA) {
            context.report({
              message: `Horizontal hierarchy violation (fallback to roles): sibling directory "${subA}" (mapped to role "${roleA}", level ${idxA}) cannot import from "${subB}" (mapped to role "${roleB}", level ${idxB}) under parent "${lca}".`,
              node,
            });
          }
        } else {
          // If no hierarchy is defined and cannot resolve roles, it is forbidden by default
          context.report({
            message: `Peer separation violation: sibling directories "${subA}" and "${subB}" cannot import each other because no horizontal hierarchy is defined under parent "${lca}".`,
            node,
          });
        }
      }
    }

    return {
      ExportAllDeclaration(node) {
        checkImport(node, node.source.value as string);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkImport(node, node.source.value as string);
        }
      },
      ImportDeclaration(node) {
        checkImport(node, node.source.value as string);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce the Law of Separation between Peers (no-peer-dependency)',
    },
    schema: [],
    type: 'problem',
  },
};

export default rule;
