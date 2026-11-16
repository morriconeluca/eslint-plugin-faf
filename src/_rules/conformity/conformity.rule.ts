import type { Rule } from 'eslint';

import nodePath from 'node:path';

import type { TAnchoredOutcome } from './_conformity@shared/_types/anchored-outcome.type.js';

import { discoverConfig } from './_stages/discover-config/index.js';
import { session } from './_stores/session/index.js';
import { readConfigFileSetting, verifyProject } from './conformity.util.js';

export function createConformity(packageVersion: string): Rule.RuleModule {
  const message = '{{constraint}}: {{message}} ({{reference}}).';
  const fileStart = { column: 0, line: 1 };

  const resolveAnchoredOutcomes = (
    configPath: string,
    context: Rule.RuleContext
  ): readonly TAnchoredOutcome[] => {
    const cached = session.lookup({
      configPath,
      filename: context.filename,
      sourceText: context.sourceCode.text,
      workingDirectory: context.cwd,
    });
    if (cached.hit) {
      return cached.outcomes;
    }

    const fileOverlays = new Map<string, string>();
    if (cached.overlayText !== null) {
      fileOverlays.set(nodePath.resolve(context.filename), cached.overlayText);
    }
    const result = verifyProject({
      configPath: cached.configPath,
      fileOverlays,
      packageVersion,
      workingDirectory: context.cwd,
    });
    session.save({
      baseDirectory: result.baseDirectory,
      byFile: result.byFile,
      configPath: cached.configPath,
      externalFiles: result.externalFiles,
      loadedFiles: result.loadedFiles,
      overrideKey: cached.overlayKey,
      treeOrigins: result.treeOrigins,
    });
    return result.byFile.get(nodePath.resolve(context.filename)) ?? [];
  };

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
          for (const item of resolveAnchoredOutcomes(
            discovered.value.configPath,
            context
          )) {
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
