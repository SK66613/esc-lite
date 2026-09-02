import { z } from 'zod';
import { ProjectSchema } from '../../project/schema';

const AIMetadataSchema = z.object({
  purpose: z.string().max(500),
  examples: z.array(z.string().max(500)).max(20).optional(),
  keywords: z.array(z.string().max(120)).max(40).optional(),
  configOptions: z.record(z.string().min(1).max(200),z.object({values:z.array(z.union([z.string(),z.number(),z.boolean()])).min(1).max(50),description:z.string().max(500).optional()}).strict()).optional(),
  presentationVariants:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(200),description:z.string().max(1000),purpose:z.string().max(500).optional(),keywords:z.array(z.string().max(120)).max(40).optional(),bestFor:z.array(z.string().max(200)).max(20).optional(),supports:z.array(z.string().min(1).max(100)).max(20)}).strict()).max(20).optional(),
  configStructures:z.record(z.string().min(1).max(200),z.object({kind:z.literal('position_map'),description:z.string().max(500),keyRange:z.object({min:z.number().int().min(0).max(1000),max:z.number().int().min(1).max(1000)}).strict(),fields:z.record(z.string().min(1).max(100),z.object({type:z.literal('string'),description:z.string().max(500).optional(),nullable:z.boolean().optional(),maxLength:z.number().int().positive().max(10000).optional(),values:z.array(z.union([z.string().max(200),z.number(),z.boolean()])).max(100).optional()}).strict()).refine(fields=>Object.keys(fields).length<=20)}).strict()).refine(structures=>Object.keys(structures).length<=20).optional(),
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

export const MAX_CONVERSATION_TURNS = 8;
export const MAX_CONVERSATION_CHARS = 6000;
export const MAX_CONVERSATION_TURN_CHARS = 1500;
export const AIConversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_CONVERSATION_TURN_CHARS),
}).strict();

export const AIPlannerRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  project: ProjectSchema,
  capabilities: CapabilityManifestSchema,
  conversation: z.array(AIConversationTurnSchema).max(MAX_CONVERSATION_TURNS).optional()
    .refine((turns) => !turns || turns.reduce((sum, turn) => sum + turn.content.length, 0) <= MAX_CONVERSATION_CHARS, 'Conversation is too long'),
}).strict();

export type AIPlannerRequest = z.infer<typeof AIPlannerRequestSchema>;
export type ValidatedCapabilityManifest = z.infer<typeof CapabilityManifestSchema>;
