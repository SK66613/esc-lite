import { z } from 'zod';

const patch = z.record(z.unknown());
export const AIActionSchema = z.discriminatedUnion('type', [
  z.object({ type:z.literal('create_from_template'), payload:z.object({templateId:z.string().min(1)}).strict() }).strict(),
  z.object({ type:z.literal('set_metadata'), payload:z.object({name:z.string().min(1).optional(),category:z.string().optional()}).strict().refine(v=>v.name!==undefined||v.category!==undefined) }).strict(),
  z.object({ type:z.literal('set_theme'), payload:z.object({preset:z.string().min(1).optional(),primaryColor:z.string().regex(/^#[0-9a-f]{6}$/i).optional(),radius:z.string().optional()}).strict().refine(v=>Object.keys(v).length>0) }).strict(),
  z.object({ type:z.literal('add_module'), payload:z.object({moduleType:z.string().min(1)}).strict() }).strict(),
  z.object({ type:z.literal('remove_module'), payload:z.object({moduleType:z.string().min(1)}).strict() }).strict(),
  z.object({ type:z.literal('set_module_enabled'), payload:z.object({moduleType:z.string().min(1),enabled:z.boolean()}).strict() }).strict(),
  z.object({ type:z.literal('patch_module_config'), payload:z.object({moduleType:z.string().min(1),patch}).strict() }).strict(),
  z.object({ type:z.literal('reorder_module'), payload:z.object({moduleType:z.string().min(1),toIndex:z.number().int().nonnegative()}).strict() }).strict(),
  z.object({ type:z.literal('set_tool_enabled'), payload:z.object({toolType:z.string().min(1),enabled:z.boolean()}).strict() }).strict(),
  z.object({ type:z.literal('patch_tool_config'), payload:z.object({toolType:z.string().min(1),patch}).strict() }).strict(),
  z.object({ type:z.literal('set_guard_enabled'), payload:z.object({guardType:z.string().min(1),enabled:z.boolean()}).strict() }).strict(),
  z.object({ type:z.literal('patch_guard_config'), payload:z.object({guardType:z.string().min(1),patch}).strict() }).strict(),
]);
export type AIAction = z.infer<typeof AIActionSchema>;
