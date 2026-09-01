import { z } from 'zod';
import { PASSPORT_COLUMNS, PASSPORT_HEADER_MODES, PASSPORT_IMAGE_ASPECTS, PASSPORT_PROGRESS_MODES, PASSPORT_STAMP_SHAPES, PASSPORT_VISUAL_VARIANTS } from './presentation/options';

export const PassportVisualVariantSchema = z.enum(PASSPORT_VISUAL_VARIANTS);
export const PassportHeaderModeSchema = z.enum(PASSPORT_HEADER_MODES);
export const PassportStampShapeSchema = z.enum(PASSPORT_STAMP_SHAPES);
export const PassportProgressModeSchema = z.enum(PASSPORT_PROGRESS_MODES);
export const PassportImageAspectSchema = z.enum(PASSPORT_IMAGE_ASPECTS);

export const LoyaltyPassportPresentationSchema = z.object({
  visualVariant: PassportVisualVariantSchema.default('classic_grid'),
  headerMode: PassportHeaderModeSchema.default('standard'),
  stampShape: PassportStampShapeSchema.default('circle'),
  progressMode: PassportProgressModeSchema.default('bar'),
  columns: z.union(PASSPORT_COLUMNS.map(value=>z.literal(value)) as [z.ZodLiteral<2>,z.ZodLiteral<3>,z.ZodLiteral<4>]).default(3),
  imageAspect: PassportImageAspectSchema.default('square'),
}).default({});

export const LoyaltyPassportConfigSchema = z.object({
  name:z.string().min(1), description:z.string(), goal:z.number().int().min(1).max(30), reward:z.string().min(1),
  showProgress:z.boolean(), offers:z.boolean(), active:z.boolean(), balance:z.number().nonnegative().default(4),
  unit:z.string().default('визитов'), presentation:LoyaltyPassportPresentationSchema,
});
export type LoyaltyPassportConfig = z.infer<typeof LoyaltyPassportConfigSchema>;
export type PassportPresentation = z.infer<typeof LoyaltyPassportPresentationSchema>;
export const createLoyaltyConfig = (): LoyaltyPassportConfig => LoyaltyPassportConfigSchema.parse({name:'Coffee Passport',description:'Купите 6 кофе — получите один бесплатно',goal:6,reward:'Бесплатный кофе',showProgress:true,offers:true,active:true,balance:4,unit:'визитов'});
