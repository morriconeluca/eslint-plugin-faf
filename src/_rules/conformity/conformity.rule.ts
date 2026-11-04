import type { Rule } from 'eslint';

export const conformity = {
  create: () => ({}),
  meta: {
    docs: {
      description:
        'Verify that the project conforms to the Fractal Architecture Framework.',
    },
    schema: [],
    type: 'problem' as const,
  },
} satisfies Rule.RuleModule;
