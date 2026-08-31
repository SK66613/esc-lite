import type { AIAction } from '../schema/AIActionSchema';
import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import type { AIPlanner, AIPlannerInput } from './AIPlanner';
const includesAny=(s:string,words:string[])=>words.some(word=>s.includes(word));
export class MockAIPlanner implements AIPlanner {
 async plan({message,capabilities}:AIPlannerInput):Promise<AIPlan>{
  const text=message.toLocaleLowerCase('ru'); const actions:AIAction[]=[]; const missing:string[]=[];
  const template=includesAny(text,['кофейн','кофе house'])?'coffee_house':includesAny(text,['салон красоты','beauty'])?'beauty_salon':includesAny(text,['ресторан'])?'restaurant':includesAny(text,['магазин'])?'store':undefined;
  if(template&&capabilities.templates.some(t=>t.id===template)) actions.push({type:'create_from_template',payload:{templateId:template}});
  const loyalty=/\b(\d{1,2})\s*(?:-?й|кофе|визит)/i.exec(text);
  if(loyalty||includesAny(text,['кофе бесплатно','один бесплатно'])) {if(capabilities.modules.some(m=>m.type==='loyalty_passport')){actions.push({type:'add_module',payload:{moduleType:'loyalty_passport'}});actions.push({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{goal:Number(loyalty?.[1]??6),reward:'Бесплатный кофе'}}});}}
  if(includesAny(text,['добавь qr','нужен qr',' qr'])) actions.push({type:'set_tool_enabled',payload:{toolType:'qr_sales',enabled:true}});
  if(includesAny(text,['убери акции','отключи акции'])) actions.push({type:'set_module_enabled',payload:{moduleType:'offers_placeholder',enabled:false}});
  const name=/(?:название|назови)\s+(?:на\s+)?[«"]?([^\n.!»"]+)/i.exec(message); if(name?.[1]) actions.push({type:'set_metadata',payload:{name:name[1].trim()}});
  const color=/#([0-9a-f]{6})\b/i.exec(message); if(color) actions.push({type:'set_theme',payload:{primaryColor:`#${color[1]}`}});
  if(includesAny(text,['онлайн-запис','онлайн запис','booking','запись'])||includesAny(text,['интернет-магазин','shop'])) missing.push(includesAny(text,['магазин','shop'])?'Интернет-магазин пока недоступен в текущем наборе возможностей.':'Онлайн-запись пока недоступна в текущем наборе возможностей.');
  const title=template?capabilities.templates.find(t=>t.id===template)?.title:'';
  return AIPlanSchema.parse({id:`mock-${simpleHash(message)}`,userIntent:message,summary:actions.length?`Подготовлю ${title?`${title} и нужные настройки`:'изменения приложения'}`:'Проверил доступные возможности',explanation:missing.length?`${missing.join(' ')} Я могу применить остальные доступные изменения.`:'Все изменения используют только доступные возможности Escalita.',actions,missingInformation:missing,suggestedQuestions:missing.length?['Продолжить с доступными возможностями?']:[],riskLevel:template?'medium':'low'});
 }
}
const simpleHash=(value:string)=>{let hash=0;for(const char of value)hash=(hash*31+char.charCodeAt(0))>>>0;return hash.toString(36)};
