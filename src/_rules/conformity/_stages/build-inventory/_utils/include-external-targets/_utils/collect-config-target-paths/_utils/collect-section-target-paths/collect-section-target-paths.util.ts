import type { TFAFSharedConfig } from '../../../../../../../../../../_src@shared/_types/faf-config.type.js';

export function collectSectionTargetPaths(
  section: TFAFSharedConfig
): readonly string[] {
  return [
    ...(section.foreignDomains ?? []),
    ...(section.publicRootNodes ?? []),
    ...(section.foreignNodes ?? []).flatMap((entry) =>
      typeof entry === 'string' ? entry : entry.paths
    ),
    ...(section.mimeticPathStructures ?? []).flatMap(
      (structure) => structure.paths
    ),
    ...(section.externalDependencies ?? []).flatMap((edge) => [
      ...edge.from,
      ...edge.to,
    ]),
  ];
}
