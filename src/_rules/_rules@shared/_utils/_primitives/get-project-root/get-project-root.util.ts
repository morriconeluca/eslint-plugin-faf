import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Returns the currently configured project root directory path.
 */
export function getProjectRoot(): string {
  return state.projectRoot;
}
