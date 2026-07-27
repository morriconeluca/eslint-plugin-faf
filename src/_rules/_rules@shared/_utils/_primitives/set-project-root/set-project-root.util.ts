import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Updates the project root directory path.
 * Invalidates the resolved import paths cache because resolution relies on the root.
 *
 * @param root - Absolute path to the mock project root.
 */
export function setProjectRoot(root: string): void {
  state.projectRoot = root;
  state.resolvedImportPathCache.clear();
}
