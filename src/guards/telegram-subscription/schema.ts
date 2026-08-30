import { z } from 'zod';
export const TelegramSubscriptionConfigSchema=z.object({channel:z.string(),botConnected:z.boolean(),failAction:z.literal('show_gate'),screenText:z.string()});
export type TelegramSubscriptionConfig=z.infer<typeof TelegramSubscriptionConfigSchema>;
export const createSubscriptionConfig=():TelegramSubscriptionConfig=>({channel:'@coffeehouseclub',botConnected:true,failAction:'show_gate',screenText:'Подпишитесь на наш канал, чтобы открыть бонусы и акции'});
