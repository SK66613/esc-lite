import type { Project } from '../project/schema';
import { createDefaultProject } from '../project/defaults';
import { createId } from '../project/id';
import { createLoyaltyConfig } from '../modules/loyalty-passport/schema';
import { createOffersConfig } from '../modules/offers-placeholder/schema';
import { createQRConfig } from '../tools/qr-sales/schema';
import { createSubscriptionConfig } from '../guards/telegram-subscription/schema';
export type TemplateId='coffee_house'|'beauty_salon'|'store'|'restaurant';
export interface TemplateBlueprint {id:TemplateId;title:string;description:string;createProject:()=>Project}
const base=(name:string,category:string,preset:string):Project=>({...createDefaultProject(),id:createId('project'),metadata:{name,category},theme:{preset,primaryColor:'#2563eb',radius:'18px'},modules:[],tools:[],guards:[],draftRevision:1});
const loyalty=(name:string,reward:string)=>({id:createId('loyalty'),type:'loyalty_passport',version:1,enabled:true,order:0,config:{...createLoyaltyConfig(),name,reward}});
const offers=(order:number)=>({id:createId('offers'),type:'offers_placeholder',version:1,enabled:true,order,config:createOffersConfig()});
const qr=()=>({id:createId('tool'),type:'qr_sales',enabled:true,config:createQRConfig()});
const guard=()=>({id:createId('guard'),type:'telegram_subscription',enabled:false,scope:'app' as const,config:createSubscriptionConfig()});
export const templateRegistry:Record<TemplateId,TemplateBlueprint>={
 coffee_house:{id:'coffee_house',title:'Coffee House',description:'Лояльность, предложения, QR и опциональный доступ',createProject:()=>{const p=base('Coffee House','Кофейня','coffee');p.modules=[loyalty('Coffee Passport','Бесплатный кофе'),offers(1)];p.tools=[qr()];p.guards=[guard()];return p;}},
 beauty_salon:{id:'beauty_salon',title:'Beauty Salon',description:'Лояльность и предложения для салона',createProject:()=>{const p=base('Beauty Space','Салон красоты','beauty');p.modules=[loyalty('Beauty Club','Скидка 20%'),offers(1)];return p;}},
 store:{id:'store',title:'Store',description:'Витрина предложений, готовая к будущему Shop',createProject:()=>{const p=base('Local Store','Магазин','store');p.modules=[offers(0)];p.tools=[qr()];return p;}},
 restaurant:{id:'restaurant',title:'Restaurant',description:'Клуб гостей, предложения и QR',createProject:()=>{const p=base('Table Club','Ресторан','restaurant');p.modules=[loyalty('Table Club','Десерт в подарок'),offers(1)];p.tools=[qr()];p.guards=[guard()];return p;}}
};
