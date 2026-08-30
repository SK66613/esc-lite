import type { Project } from './schema';
import { createId } from './id';
import { createLoyaltyConfig } from '../modules/loyalty-passport/schema';
import { createOffersConfig } from '../modules/offers-placeholder/schema';
import { createSubscriptionConfig } from '../guards/telegram-subscription/schema';
import { createQRConfig } from '../tools/qr-sales/schema';

export const createDefaultProject=():Project=>({schemaVersion:1,id:createId('project'),metadata:{name:'Coffee House',category:'Кофейня'},theme:{preset:'coffee',primaryColor:'#2563eb',radius:'18px'},navigation:{items:[{id:'home',label:'Главная',target:'home'},{id:'offers',label:'Предложения',target:'offers'}]},modules:[{id:createId('loyalty'),type:'loyalty_passport',version:1,enabled:true,order:0,config:createLoyaltyConfig()},{id:createId('offers'),type:'offers_placeholder',version:1,enabled:true,order:1,config:createOffersConfig()}],guards:[{id:createId('guard'),type:'telegram_subscription',enabled:false,scope:'app',config:createSubscriptionConfig()}],tools:[{id:createId('tool'),type:'qr_sales',enabled:true,config:createQRConfig()}],draftRevision:1});
