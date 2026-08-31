import { z } from 'zod';

const PatchSchema = z.record(z.unknown());
const MetadataPayloadSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
}).refine((value) => value.name !== undefined || value.category !== undefined, 'Metadata patch is empty');
const ThemePayloadSchema = z.object({
  preset: z.string().min(1).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  radius: z.string().min(1).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Theme patch is empty');

export const AIActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create_from_template'), payload: z.object({ templateId: z.string().min(1) }) }),
  z.object({ type: z.literal('set_metadata'), payload: MetadataPayloadSchema }),
  z.object({ type: z.literal('set_theme'), payload: ThemePayloadSchema }),
  z.object({ type: z.literal('add_module'), payload: z.object({ moduleType: z.string().min(1) }) }),
  z.object({ type: z.literal('remove_module'), payload: z.object({ moduleType: z.string().min(1) }) }),
  z.object({ type: z.literal('set_module_enabled'), payload: z.object({ moduleType: z.string().min(1), enabled: z.boolean() }) }),
  z.object({ type: z.literal('patch_module_config'), payload: z.object({ moduleType: z.string().min(1), patch: PatchSchema }) }),
  z.object({ type: z.literal('reorder_module'), payload: z.object({ moduleType: z.string().min(1), order: z.number().int().nonnegative() }) }),
  z.object({ type: z.literal('set_tool_enabled'), payload: z.object({ toolType: z.string().min(1), enabled: z.boolean() }) }),
  z.object({ type: z.literal('patch_tool_config'), payload: z.object({ toolType: z.string().min(1), patch: PatchSchema }) }),
  z.object({ type: z.literal('set_guard_enabled'), payload: z.object({ guardType: z.string().min(1), enabled: z.boolean() }) }),
  z.object({ type: z.literal('patch_guard_config'), payload: z.object({ guardType: z.string().min(1), patch: PatchSchema }) }),
]);

export type AIAction = z.infer<typeof AIActionSchema>;
