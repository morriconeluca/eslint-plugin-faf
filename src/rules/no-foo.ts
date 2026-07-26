import type { Rule } from 'eslint';

import { ESLintUtils } from '@typescript-eslint/utils';

export const ruleCreator = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/lucamorricone/eslint-plugin-faf/blob/main/docs/rules/${name}.md`
);

// Adapt typescript-eslint rule to standard ESLint RuleModule.
// This is strictly required due to compile-time typings incompatibility between
// @typescript-eslint/utils's custom RuleContext and ESLint's RuleContext,
// despite them being fully compatible at runtime.
function toESLintRule(rule: unknown): Rule.RuleModule {
  return rule as Rule.RuleModule;
}

export const noFooRule = toESLintRule(
  ruleCreator({
    create(context) {
      return {
        Identifier(node) {
          if (node.name === 'foo') {
            context.report({
              messageId: 'noFooMessage',
              node,
            });
          }
        },
      };
    },
    defaultOptions: [],
    meta: {
      docs: {
        description: 'Bans the use of variables named "foo".',
      },
      messages: {
        noFooMessage: 'Variables named "foo" are not allowed.',
      },
      schema: [],
      type: 'suggestion',
    },
    name: 'no-foo',
  })
);
