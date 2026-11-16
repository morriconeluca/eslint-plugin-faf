import { z } from 'zod';

const valueMessageSchema = z.object({
  kind: z.literal('value'),
  loadedFiles: z.array(z.string()),
  value: z.unknown(),
});

export const workerMessageSchema = z
  .discriminatedUnion('kind', [
    z.object({
      kind: z.literal('clone-error'),
      message: z.unknown().optional(),
    }),
    z.object({
      error: z.unknown().optional(),
      kind: z.literal('error'),
    }),
    z.object({
      kind: z.literal('function'),
    }),
    z.object({
      kind: z.literal('missing'),
    }),
    z.object({
      kind: z.literal('thenable'),
    }),
    valueMessageSchema,
  ])
  .refine((payload) => payload.kind !== 'value' || 'value' in payload);

export const workerErrorSchema = z.object({
  code: z.string().optional().catch(undefined),
  message: z.string().optional().catch(undefined),
});
