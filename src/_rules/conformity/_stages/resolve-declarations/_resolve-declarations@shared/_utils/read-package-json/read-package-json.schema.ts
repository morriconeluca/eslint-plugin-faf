import { z } from 'zod';

export const packageJsonObjectSchema = z.record(z.string(), z.unknown());
