import { z } from 'zod';
export const LoyaltyPassportConfigSchema = z.object({name:z.string().min(1),description:z.string(),goal:z.number().int().min(1).max(30),reward:z.string().min(1),showProgress:z.boolean(),offers:z.boolean(),active:z.boolean(),balance:z.number().nonnegative().default(4),unit:z.string().default('визитов')});
export type LoyaltyPassportConfig = z.infer<typeof LoyaltyPassportConfigSchema>;
export const createLoyaltyConfig = (): LoyaltyPassportConfig => ({name:'Coffee Passport',description:'Купите 6 кофе — получите один бесплатно',goal:6,reward:'Бесплатный кофе',showProgress:true,offers:true,active:true,balance:4,unit:'визитов'});
