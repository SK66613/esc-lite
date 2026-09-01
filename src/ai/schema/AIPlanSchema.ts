import { z } from 'zod';
import { AIActionSchema } from './AIActionSchema';

export const AIPlanSchema = z.object({
  id: z.string().min(1),
  userIntent: z.string(),
  summary: z.string(),
  explanation: z.string(),
  actions: z.array(AIActionSchema).max(20),
  missingInformation: z.array(z.string()).max(20),
  suggestedQuestions: z.array(z.string()).max(20),
  riskLevel: z.enum(['low','medium','high']),
}).strict();

export type AIPlan = z.infer<typeof AIPlanSchema>;
