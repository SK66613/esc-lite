import { createDefaultProject } from '../defaults';
import { ProjectSchema, type Project } from '../schema';
import { LoyaltyPassportConfigSchema } from '../../modules/loyalty-passport/schema';
import { QRToolConfigSchema } from '../../tools/qr-sales/schema';
import { TelegramSubscriptionConfigSchema } from '../../guards/telegram-subscription/schema';

const record=(value:unknown):Record<string,unknown>|undefined=>typeof value==='object'&&value!==null&&!Array.isArray(value)?value as Record<string,unknown>:undefined;
export function migrateLegacyState(value:unknown):Project|null {
  const old=record(value); if(!old)return null;
  const project=createDefaultProject(), app=record(old.app), passport=record(old.passport), qr=record(old.qr), subscription=record(old.subscription);
  if(app){if(typeof app.name==='string'&&app.name)project.metadata.name=app.name;if(typeof app.category==='string')project.metadata.category=app.category;}
  const loyalty=project.modules.find(m=>m.type==='loyalty_passport');
  if(loyalty&&passport){const base=LoyaltyPassportConfigSchema.parse(loyalty.config);loyalty.config=LoyaltyPassportConfigSchema.parse({...base,...passport,showProgress:typeof passport.progress==='boolean'?passport.progress:base.showProgress});}
  const tool=project.tools.find(t=>t.type==='qr_sales');if(tool&&qr){const base=QRToolConfigSchema.parse(tool.config);tool.config=QRToolConfigSchema.parse({...base,...qr});tool.enabled=typeof qr.enabled==='boolean'?qr.enabled:tool.enabled;}
  const guard=project.guards.find(g=>g.type==='telegram_subscription');if(guard&&subscription){const base=TelegramSubscriptionConfigSchema.parse(guard.config);guard.config=TelegramSubscriptionConfigSchema.parse({...base,...subscription,failAction:'show_gate'});guard.enabled=typeof subscription.enabled==='boolean'?subscription.enabled:guard.enabled;}
  return ProjectSchema.parse(project);
}
