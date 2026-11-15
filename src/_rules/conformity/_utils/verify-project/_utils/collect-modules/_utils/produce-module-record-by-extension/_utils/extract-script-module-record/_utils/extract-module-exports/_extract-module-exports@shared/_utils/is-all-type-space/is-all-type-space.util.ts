import type { TRootSymbol } from '../../../../../../../../../../../_verify-project@shared/_types/verification-model.type.js';

export function isAllTypeSpace(
  name: string,
  rootSymbols: readonly TRootSymbol[]
): boolean {
  const matching = rootSymbols.filter((symbol) => symbol.name === name);
  return (
    matching.length > 0 && matching.every((symbol) => symbol.space === 'type')
  );
}
