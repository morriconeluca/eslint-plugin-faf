import type { TRootSymbol } from '../../../../../../../../../../../../../../../../_session@shared/_types/module-record.type.js';
import type { TImportedBinding } from '../../../../../../../../_extract-script-module-record@shared/_types/imported-binding.type.js';

export function isLocalTypeExport(
  isExplicitlyTypeOnly: boolean,
  binding: TImportedBinding | undefined,
  localName: string,
  rootSymbols: readonly TRootSymbol[]
): boolean {
  return (
    isExplicitlyTypeOnly &&
    binding !== undefined &&
    !binding.isTypeOnly &&
    rootSymbols.some(
      (symbol) => symbol.name === localName && symbol.space === 'type'
    )
  );
}
