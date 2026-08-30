import { z } from 'zod';
export const QRToolConfigSchema=z.object({enabled:z.boolean(),accrual:z.string(),afterText:z.string(),role:z.string(),point:z.string(),format:z.string()});
export type QRToolConfig=z.infer<typeof QRToolConfigSchema>;
export const createQRConfig=():QRToolConfig=>({enabled:true,accrual:'+1 визит',afterText:'Спасибо! Баллы начислены',role:'Кассир',point:'Coffee House · Арбат',format:'Escalita QR'});
