import type { TEffectiveDeclarations } from '../../../../../../_declarations/_types/declarations.type.js';
import type { TFAFConfig } from '../../../../../../_domain/_types/faf-config.type.js';
import type { TInventory } from '../../../../../../_inventory/_types/inventory.type.js';
import type { TReferenceContext } from '../../_types/reference-context.type.js';

import { toPosixPath } from '../../../../../../_domain/_utils/to-posix-path/index.js';
import { collectEnumeratedRootNodes } from './_utils/collect-enumerated-root-nodes/index.js';
import { collectOwnedOrigins } from './_utils/collect-owned-origins/index.js';

export function createReferenceContext(
  config: TFAFConfig,
  declarations: TEffectiveDeclarations,
  inventory: TInventory
): TReferenceContext {
  return {
    aliasPrefixes: declarations.aliases.map((alias) => alias.prefix),
    baseDirectory: toPosixPath(declarations.baseDirectory),
    enumeratedRootNodes: collectEnumeratedRootNodes(config),
    inventory,
    ownedOrigins: collectOwnedOrigins(config, declarations),
  };
}
