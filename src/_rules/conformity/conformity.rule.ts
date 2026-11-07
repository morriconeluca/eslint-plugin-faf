import type { Rule } from 'eslint';

import { discoverConfig } from './_adapters/discover-config/index.js';
import { session } from './_stores/session/index.js';
import { readConfigFileSetting } from './_utils/read-config-file-setting/index.js';

export function createConformity(packageVersion: string): Rule.RuleModule {
  const message = '{{constraint}}: {{message}} ({{reference}}).';
  const fileStart = { column: 0, line: 1 };
  return {
    create(context) {
      return {
        Program() {
          const discovered = discoverConfig({
            configFile: readConfigFileSetting(context.settings),
            workingDirectory: context.cwd,
          });
          if (!discovered.ok) {
            for (const outcome of discovered.outcomes) {
              context.report({
                data: {
                  constraint: outcome.constraint,
                  message: outcome.message,
                  reference: outcome.normativeReference,
                },
                loc: { end: fileStart, start: fileStart },
                messageId: outcome.family,
              });
            }
            return;
          }
          const anchored = session.outcomesFor({
            configPath: discovered.value.configPath,
            filename: context.filename,
            packageVersion,
            sourceText: context.sourceCode.text,
            workingDirectory: context.cwd,
          });
          for (const item of anchored) {
            const start = {
              column: Math.max(0, item.position.column - 1),
              line: item.position.line,
            };
            context.report({
              data: {
                constraint: item.outcome.constraint,
                message: item.outcome.message,
                reference: item.outcome.normativeReference,
              },
              loc: { end: start, start },
              messageId: item.outcome.family,
            });
          }
        },
      };
    },
    meta: {
      docs: {
        description:
          'Verify that the project conforms to the Fractal Architecture Framework.',
      },
      messages: {
        acyclicity: message,
        classification: message,
        configuration: message,
        dependency: message,
        symbol: message,
        unverified: message,
      },
      schema: [],
      type: 'problem',
    },
  };
}
