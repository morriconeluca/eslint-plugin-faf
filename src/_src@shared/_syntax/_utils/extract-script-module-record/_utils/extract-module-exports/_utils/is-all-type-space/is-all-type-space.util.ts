import type { TRootSymbol } from '../../../../../../_types/module-record.type.js';

export function isAllTypeSpace(
  name: string,
  rootSymbols: readonly TRootSymbol[]
): boolean {
  const matching = rootSymbols.filter((symbol) => symbol.name === name);
  return (
    matching.length > 0 && matching.every((symbol) => symbol.space === 'type')
  );
}
