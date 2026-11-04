import type { TFAFLocalConfig } from '../../../../../../../../../../../../../../_src@shared/_types/faf-config.type.js';

export function hasOnlyRootLayers(local: TFAFLocalConfig): boolean {
  const hasFragments = (local.rootFragments?.length ?? 0) > 0;
  const hasLayers = (local.rootLayers?.length ?? 0) > 0;
  return !hasFragments && hasLayers;
}
