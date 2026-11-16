import { z } from 'zod';

export const importsObjectSchema = z.record(z.string(), z.unknown());
