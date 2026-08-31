import { z } from 'zod';
import { AIActionSchema } from './AIActionSchema';

export const AIPlanSchema = z.object({
  id: z.string().min(1),
  userIntent: z.string().min(1),
  summary: z.string().min(1),
  explanation: z.string(),
  actions: z.array(AIActionSchema),
  missingInformation: z.array(z.string()),
  suggestedQuestions: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export type AIPlan = z.infer<typeof AIPlanSchema>;
