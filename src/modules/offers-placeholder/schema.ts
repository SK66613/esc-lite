import { z } from 'zod';
export const OffersConfigSchema=z.object({title:z.string(),emptyText:z.string(),activeCount:z.number().int().nonnegative()});
export type OffersConfig=z.infer<typeof OffersConfigSchema>;
export const createOffersConfig=():OffersConfig=>({title:'Предложения',emptyText:'Новые предложения скоро появятся',activeCount:0});
