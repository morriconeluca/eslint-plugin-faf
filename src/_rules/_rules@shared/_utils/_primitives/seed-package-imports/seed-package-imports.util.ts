import { state } from '#_utils@shared/_stores/cache/index.js';

/**
 * Seeds the package.json imports mock cache for test suites.
 * Invalidates `state.resolvedImportPathCache` to ensure new imports are resolved against the seeded alias map.
 *
 * @param imports - Mapped aliases and target paths.
 */
export function seedPackageImports(imports: Record<string, string>): void {
  state.packageImports = imports;
  state.resolvedImportPathCache.clear();
}
