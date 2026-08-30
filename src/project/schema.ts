import { z } from 'zod';

export const NavigationItemSchema = z.object({ id:z.string(), label:z.string(), target:z.string() });
export const ModuleInstanceSchema = z.object({ id:z.string(), type:z.string(), version:z.number().int().positive(), enabled:z.boolean(), order:z.number().int().nonnegative(), config:z.unknown() });
const GuardBaseSchema = z.object({
  id: z.string(), type: z.string(), enabled: z.boolean(), config: z.unknown(),
});
export const GuardInstanceSchema = z.discriminatedUnion('scope', [
  GuardBaseSchema.extend({ scope: z.literal('app'), moduleId: z.undefined().optional() }),
  GuardBaseSchema.extend({ scope: z.literal('module'), moduleId: z.string().min(1) }),
]);
export const ToolInstanceSchema = z.object({ id:z.string(), type:z.string(), enabled:z.boolean(), config:z.unknown() });

const ProjectSnapshotSchema = z.object({
  schemaVersion:z.literal(1), id:z.string(),
  metadata:z.object({name:z.string().min(1),category:z.string().optional()}),
  theme:z.object({preset:z.string(),primaryColor:z.string().optional(),radius:z.string().optional()}),
  navigation:z.object({items:z.array(NavigationItemSchema)}), modules:z.array(ModuleInstanceSchema),
  guards:z.array(GuardInstanceSchema), tools:z.array(ToolInstanceSchema), draftRevision:z.number().int().nonnegative()
});
export const ProjectSchema = ProjectSnapshotSchema.extend({ published:z.object({revision:z.number().int().nonnegative(),publishedAt:z.string().datetime(),snapshot:ProjectSnapshotSchema}).optional() });
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>;
export type ModuleInstance = z.infer<typeof ModuleInstanceSchema>;
export type GuardInstance = z.infer<typeof GuardInstanceSchema>;
export type ToolInstance = z.infer<typeof ToolInstanceSchema>;
