import type { Rule } from 'eslint';

import { type Type, TypeFlags } from 'typescript';

const TYPEOF_FLAGS = {
  bigint: TypeFlags.BigIntLike,
  boolean: TypeFlags.BooleanLike,
  number: TypeFlags.NumberLike,
  string: TypeFlags.StringLike,
  symbol: TypeFlags.ESSymbolLike,
  undefined: TypeFlags.Undefined,
} as const;

type TTypeofKind = keyof typeof TYPEOF_FLAGS;

type TTypeQuery = {
  readonly getTypeAtLocation: (node: unknown) => Type;
};

const isTypeofKind = (value: string): value is TTypeofKind =>
  Object.hasOwn(TYPEOF_FLAGS, value);

const isOnlyTypeofKind = (type: Type, flags: TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((part) => isOnlyTypeofKind(part, flags))
    : (type.flags & flags) !== 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isTypeQuery = (value: unknown): value is TTypeQuery =>
  isRecord(value) && typeof value['getTypeAtLocation'] === 'function';

const readTypeQuery = (sourceCode: object): null | TTypeQuery => {
  if (!('parserServices' in sourceCode)) {
    return null;
  }
  const services = sourceCode.parserServices;
  return isTypeQuery(services) ? services : null;
};

const readStringLiteral = (node: unknown): null | string => {
  if (!isRecord(node) || node['type'] !== 'Literal') {
    return null;
  }
  const value = node['value'];
  return typeof value === 'string' ? value : null;
};

const readTypeofOperand = (expression: Rule.Node): unknown => {
  if (expression.type !== 'BinaryExpression' || expression.operator !== '===') {
    return null;
  }
  const { left } = expression;
  return left.type === 'UnaryExpression' && left.operator === 'typeof'
    ? left.argument
    : null;
};

const readTypeofKind = (expression: Rule.Node): null | TTypeofKind => {
  if (expression.type !== 'BinaryExpression') {
    return null;
  }
  const literal = readStringLiteral(expression.right);
  return literal === null || !isTypeofKind(literal) ? null : literal;
};

const isSyntaxNode = (value: unknown): value is Rule.Node =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof value.type === 'string';

const reportDecidedTypeof = (
  context: Rule.RuleContext,
  typeQuery: TTypeQuery,
  argument: unknown
): void => {
  if (!isSyntaxNode(argument)) {
    return;
  }
  const operand = readTypeofOperand(argument);
  const kind = readTypeofKind(argument);
  if (operand === null || kind === null) {
    return;
  }
  const operandType = typeQuery.getTypeAtLocation(operand);
  if (isOnlyTypeofKind(operandType, TYPEOF_FLAGS[kind])) {
    context.report({
      messageId: 'decidedAssertion',
      node: argument,
    });
  }
};

export const noDecidedAssertionRule: Rule.RuleModule = {
  create(context) {
    const typeQuery = readTypeQuery(context.sourceCode);
    if (typeQuery === null) {
      return {};
    }

    return {
      CallExpression(node) {
        const { callee } = node;
        if (callee.type !== 'Identifier' || callee.name !== 'assertInvariant') {
          return;
        }
        const argument = node.arguments[0];
        if (argument === undefined || argument.type === 'SpreadElement') {
          return;
        }
        reportDecidedTypeof(context, typeQuery, argument);
      },
    };
  },
  meta: {
    docs: {
      description:
        'Forbid assertInvariant conditions that the parameter type has already decided.',
    },
    messages: {
      decidedAssertion:
        'Assertion condition is already decided by the type of its operand. Remove the defensive check.',
    },
    schema: [],
    type: 'problem',
  },
};
