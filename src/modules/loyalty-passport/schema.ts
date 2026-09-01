import { z } from 'zod';

export const PassportVisualVariantSchema = z.enum(['classic_grid','punch_card','journey_path','collection_gallery','minimal_counter']);
export const PassportHeaderModeSchema = z.enum(['compact','standard','hero']);
export const PassportStampShapeSchema = z.enum(['circle','rounded','square']);
export const PassportProgressModeSchema = z.enum(['bar','counter','ring','hidden']);
export const PassportImageAspectSchema = z.enum(['square','portrait','landscape']);

export const LoyaltyPassportPresentationSchema = z.object({
  visualVariant: PassportVisualVariantSchema.default('classic_grid'),
  headerMode: PassportHeaderModeSchema.default('standard'),
  stampShape: PassportStampShapeSchema.default('circle'),
  progressMode: PassportProgressModeSchema.default('bar'),
  columns: z.union([z.literal(2),z.literal(3),z.literal(4)]).default(3),
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
