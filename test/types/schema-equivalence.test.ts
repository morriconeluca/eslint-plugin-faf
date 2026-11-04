import { describe, expect, it } from 'vitest';

import { compileInBothModes } from './type-harness.js';

const DIVERGENCE_SNIPPET = `
import type { TFAFConfig } from './src/main.js';

type TEquals<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight ? 1 : 2
    ? true
    : false;

type TDivergent = { readonly extra: string };
const divergent: TEquals<TDivergent, TFAFConfig> = true;
`;

describe('Zod schema equivalence with TFAFConfig', () => {
  it('rejects a divergent type in both optional-property modes', () => {
    const result = compileInBothModes(DIVERGENCE_SNIPPET);
    expect(result.strictErrors.length).toBeGreaterThan(0);
    expect(result.looseErrors.length).toBeGreaterThan(0);
  });
});
