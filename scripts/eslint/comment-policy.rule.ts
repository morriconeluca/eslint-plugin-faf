import type { Rule } from 'eslint';

type TComment = ReturnType<
  Rule.RuleContext['sourceCode']['getAllComments']
>[number];

type TCommentWithLocation = TComment & {
  readonly loc: NonNullable<TComment['loc']>;
};

const hasLocation = (comment: TComment): comment is TCommentWithLocation =>
  comment.loc !== undefined && comment.loc !== null;

export const commentPolicyRule: Rule.RuleModule = {
  create(context) {
    return {
      Program() {
        const isTypeFile = context.filename.endsWith('.type.ts');
        const comments = context.sourceCode
          .getAllComments()
          .filter(hasLocation);

        for (const comment of comments) {
          const isAllowed =
            isTypeFile &&
            comment.type === 'Block' &&
            comment.value.startsWith('*');

          if (!isAllowed) {
            context.report({
              loc: comment.loc,
              messageId: 'forbiddenComment',
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce comment policy: comments are forbidden except JSDoc block comments in *.type.ts files.',
    },
    messages: {
      forbiddenComment:
        'Comments are forbidden in this codebase, except for JSDoc block comments in *.type.ts files.',
    },
    type: 'problem',
  },
};
