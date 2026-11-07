import { z } from 'zod';

export const workerMessageSchema = z.record(z.string(), z.unknown());
