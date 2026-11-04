import { z } from 'zod';

export const importTargetNodeSchema = z.union([
  z.string(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);
