import { QrCode } from 'lucide-react';import { QRToolConfigSchema,createQRConfig } from './qr-sales/schema';import { QRToolPage } from './qr-sales/QRToolPage';
export const toolRegistry={qr_sales:{type:'qr_sales',title:'QR Sales',description:'Сканирование и локальное начисление',icon:QrCode,ConfigSchema:QRToolConfigSchema,createDefaultConfig:createQRConfig,SettingsComponent:QRToolPage}};
