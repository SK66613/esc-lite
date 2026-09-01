import { z } from 'zod';
import { ProjectSchema } from '../../project/schema';
import { MAX_AI_CONVERSATION_CHARS, MAX_AI_CONVERSATION_TURN_CHARS, MAX_AI_CONVERSATION_TURNS } from '../planner/AIPlanner';

const AIMetadataSchema = z.object({
  purpose: z.string().max(500),
  examples: z.array(z.string().max(500)).max(20).optional(),
  keywords: z.array(z.string().max(120)).max(40).optional(),
}).strict();

const ModuleCapabilitySchema = z.object({
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  version: z.number().int().positive(),
  defaultConfig: z.unknown(),
  ai: AIMetadataSchema.optional(),
}).strict();

const SimpleCapabilitySchema = z.object({
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  defaultConfig: z.unknown(),
}).strict();

const TemplateCapabilitySchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
}).strict();

export const CapabilityManifestSchema = z.object({
  modules: z.array(ModuleCapabilitySchema).max(100),
  tools: z.array(SimpleCapabilitySchema).max(100),
  guards: z.array(SimpleCapabilitySchema).max(100),
  templates: z.array(TemplateCapabilitySchema).max(100),
}).strict();

export const AIConversationTurnSchema = z.object({
  role: z.enum(['user','assistant']),
  content: z.string().trim().min(1).max(MAX_AI_CONVERSATION_TURN_CHARS),
}).strict();

export const AIConversationSchema = z.array(AIConversationTurnSchema)
  .max(MAX_AI_CONVERSATION_TURNS)
  .superRefine((turns, ctx) => {
    const total = turns.reduce((sum, turn) => sum + turn.content.length, 0);
    if (total > MAX_AI_CONVERSATION_CHARS) ctx.addIssue({ code:z.ZodIssueCode.custom, message:'Conversation is too large' });
  });

export const AIPlannerRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  project: ProjectSchema,
  capabilities: CapabilityManifestSchema,
  conversation: AIConversationSchema.optional(),
}).strict();

export type AIPlannerRequest = z.infer<typeof AIPlannerRequestSchema>;
export type ValidatedCapabilityManifest = z.infer<typeof CapabilityManifestSchema>;
