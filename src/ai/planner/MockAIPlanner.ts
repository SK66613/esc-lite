import type { AIAction } from '../schema/AIActionSchema';
import {passportVariantSupports,type PassportPresentationAxis,type PassportVisualVariant} from '../../modules/loyalty-passport/presentation/options';
import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import type { AIPlanner, AIPlannerInput } from './AIPlanner';
const includesAny=(s:string,words:string[])=>words.some(word=>s.includes(word));
export class MockAIPlanner implements AIPlanner {
 async plan({message,capabilities,project}:AIPlannerInput):Promise<AIPlan>{
  const text=message.toLocaleLowerCase('ru'); const actions:AIAction[]=[]; const missing:string[]=[];
  const wantsNewApp=includesAny(text,['сделай приложение','создай приложение','собери приложение','сделай mini','создай mini','сделай мини','создай мини']);
  const passportExists=project.modules.some(module=>module.type==='loyalty_passport');
  const variant=includesAny(text,['как настоящую карточку','карточка с печатями'])?'punch_card':includesAny(text,['дорожкой','путь','этапы'])?'journey_path':includesAny(text,['коллекция','коллекцию','как коллекцию'])?'collection_gallery':includesAny(text,['минималистично','проще','только прогресс','без кучи кружочков'])?'minimal_counter':includesAny(text,['классический','обычная сетка','обычный вид'])?'classic_grid':undefined;
  if(passportExists){const presentation:Record<string,unknown>={};if(variant)presentation.visualVariant=variant;if(includesAny(text,['квадратные отметки']))presentation.stampShape='square';if(includesAny(text,['круглые отметки']))presentation.stampShape='circle';if(includesAny(text,['крупная шапка']))presentation.headerMode='hero';if(includesAny(text,['кольцо прогресса']))presentation.progressMode='ring';if(includesAny(text,['без полосы прогресса']))presentation.progressMode='counter';if(/(?:^|\s)4 колонки/.test(text))presentation.columns=4;if(includesAny(text,['вертикальная коллекция','вертикальную коллекцию'])){presentation.visualVariant='collection_gallery';presentation.imageAspect='portrait';}const currentModule=project.modules.find(module=>module.type==='loyalty_passport');const currentPresentation=currentModule?.config&&typeof currentModule.config==='object'?(currentModule.config as Record<string,unknown>).presentation:undefined;const currentVariant=currentPresentation&&typeof currentPresentation==='object'?(currentPresentation as Record<string,unknown>).visualVariant:undefined;const effectiveVariant=(typeof presentation.visualVariant==='string'?presentation.visualVariant:typeof currentVariant==='string'?currentVariant:'classic_grid') as PassportVisualVariant;for(const axis of Object.keys(presentation)){if(axis!=='visualVariant'&&!passportVariantSupports(effectiveVariant,axis as PassportPresentationAxis)){delete presentation[axis];missing.push(`Текущий вид «${effectiveVariant}» не использует настройку «${axis}».`);}}if(Object.keys(presentation).length)actions.push({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{presentation}}});}
  const template=wantsNewApp?(includesAny(text,['кофейн','кофе house'])?'coffee_house':includesAny(text,['салон красоты','beauty'])?'beauty_salon':includesAny(text,['ресторан'])?'restaurant':includesAny(text,['магазин'])?'store':undefined):undefined;
  if(template&&capabilities.templates.some(t=>t.id===template)) actions.push({type:'create_from_template',payload:{templateId:template}});
  const loyalty=/\b(\d{1,2})\s*(?:-?й|кофе|визит)/i.exec(text);
  if(loyalty||includesAny(text,['кофе бесплатно','один бесплатно'])) {if(capabilities.modules.some(m=>m.type==='loyalty_passport')){actions.push({type:'add_module',payload:{moduleType:'loyalty_passport'}});actions.push({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{goal:Number(loyalty?.[1]??6),reward:'Бесплатный кофе'}}});}}
  if(includesAny(text,['добавь qr','нужен qr',' qr'])) actions.push({type:'set_tool_enabled',payload:{toolType:'qr_sales',enabled:true}});
  if(includesAny(text,['убери акции','отключи акции'])) actions.push({type:'set_module_enabled',payload:{moduleType:'offers_placeholder',enabled:false}});
  const name=/(?:название|назови)\s+(?:на\s+)?[«"]?([^\n.!»"]+)/i.exec(message); if(name?.[1]) actions.push({type:'set_metadata',payload:{name:name[1].trim()}});
  const color=/#([0-9a-f]{6})\b/i.exec(message); if(color) actions.push({type:'set_theme',payload:{primaryColor:`#${color[1]}`}}); else if(includesAny(text,['другой цвет','тёмный','темнее'])) actions.push({type:'set_theme',payload:{primaryColor:'#172033'}});
  const asksBooking=includesAny(text,['онлайн-запис','онлайн запис','booking','запись']);
  const asksShopFeature=includesAny(text,['добавь магазин','интернет-магазин','shop','корзин','каталог товаров']);
  if(asksBooking) missing.push('Онлайн-запись пока недоступна в текущем наборе возможностей.');
  if(asksShopFeature&&!(wantsNewApp&&template==='store')) missing.push('Интернет-магазин пока недоступен в текущем наборе возможностей.');
  const title=template?capabilities.templates.find(t=>t.id===template)?.title:'';
  return AIPlanSchema.parse({id:`mock-${simpleHash(message)}`,userIntent:message,summary:actions.length?`Подготовлю ${title?`${title} и нужные настройки`:'изменения приложения'}`:'Проверил доступные возможности',explanation:missing.length?`${missing.join(' ')} Я могу применить остальные доступные изменения.`:'Все изменения используют только доступные возможности Escalita.',actions,missingInformation:missing,suggestedQuestions:missing.length?['Продолжить с доступными возможностями?']:[],riskLevel:template?'medium':'low'});
 }
}
const simpleHash=(value:string)=>{let hash=0;for(const char of value)hash=(hash*31+char.charCodeAt(0))>>>0;return hash.toString(36)};
