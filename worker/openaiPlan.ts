import type { AIPlan } from '../src/ai/schema/AIPlanSchema';
import { AIPlanSchema } from '../src/ai/schema/AIPlanSchema';
import { AIPlannerRequestSchema, type AIPlannerRequest, type ValidatedCapabilityManifest } from '../src/ai/schema/AIPlannerRequestSchema';
import { AI_COMPOSER_SYSTEM_PROMPT } from '../src/ai/prompts/systemPrompt';
import { SERVER_ALLOWED_CAPABILITY_IDS } from '../src/ai/capabilities/allowedCapabilityIds';
import { AI_PLAN_JSON_SCHEMA } from './aiPlanJsonSchema';

export const DEFAULT_AI_MODEL='gpt-5.6-terra';
export type AIUsage={inputTokens?:number;outputTokens?:number;totalTokens?:number};
export class AIServiceError extends Error{constructor(public readonly code:string,public readonly status:number,message:string){super(message);this.name='AIServiceError';}}
type CreatePlanOptions={apiKey:string;model?:string;fetchImpl?:typeof fetch;timeoutMs?:number;onUsage?:(usage:AIUsage)=>void};
type OpenAIResponseLike={output_text?:unknown;output?:unknown;usage?:unknown;error?:{message?:unknown}};

export function extractOpenAIOutputText(value:unknown):string{
 const root=(value&&typeof value==='object'?value:{}) as OpenAIResponseLike;
 if(typeof root.output_text==='string'&&root.output_text.trim())return root.output_text;
 if(!Array.isArray(root.output))throw new AIServiceError('AI_EMPTY_RESPONSE',502,'AI вернул пустой ответ');
 for(const item of root.output){if(!item||typeof item!=='object')continue;const content=(item as {content?:unknown}).content;if(!Array.isArray(content))continue;for(const part of content){if(!part||typeof part!=='object')continue;const typed=part as {type?:unknown;text?:unknown;refusal?:unknown};if(typed.type==='refusal')throw new AIServiceError('AI_REFUSED',422,'AI не смог обработать этот запрос');if(typed.type==='output_text'&&typeof typed.text==='string'&&typed.text.trim())return typed.text;}}
 throw new AIServiceError('AI_EMPTY_RESPONSE',502,'AI вернул пустой ответ');
}

const numberValue=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:undefined;
export function extractOpenAIUsage(value:unknown):AIUsage{
 const root=value&&typeof value==='object'?value as {usage?:unknown}:{};const usage=root.usage&&typeof root.usage==='object'?root.usage as Record<string,unknown>:{};
 return {inputTokens:numberValue(usage.input_tokens),outputTokens:numberValue(usage.output_tokens),totalTokens:numberValue(usage.total_tokens)};
}
const configKeys=(value:unknown):Set<string>|null=>value&&typeof value==='object'&&!Array.isArray(value)?new Set(Object.keys(value as Record<string,unknown>)):null;
const assertPatchKeys=(patchValue:unknown,defaultConfig:unknown,label:string)=>{if(!patchValue||typeof patchValue!=='object'||Array.isArray(patchValue))return;const allowed=configKeys(defaultConfig);if(!allowed)return;for(const key of Object.keys(patchValue as Record<string,unknown>))if(!allowed.has(key))throw new AIServiceError('AI_INVALID_PLAN',502,`AI предложил неизвестную настройку ${label}.${key}`);};

export function assertServerOwnedCapabilities(capabilities:ValidatedCapabilityManifest){
 for(const item of capabilities.modules)if(!SERVER_ALLOWED_CAPABILITY_IDS.modules.has(item.type))throw new AIServiceError('INVALID_REQUEST',400,'Client requested an unauthorized module capability');
 for(const item of capabilities.tools)if(!SERVER_ALLOWED_CAPABILITY_IDS.tools.has(item.type))throw new AIServiceError('INVALID_REQUEST',400,'Client requested an unauthorized tool capability');
 for(const item of capabilities.guards)if(!SERVER_ALLOWED_CAPABILITY_IDS.guards.has(item.type))throw new AIServiceError('INVALID_REQUEST',400,'Client requested an unauthorized guard capability');
 for(const item of capabilities.templates)if(!SERVER_ALLOWED_CAPABILITY_IDS.templates.has(item.id))throw new AIServiceError('INVALID_REQUEST',400,'Client requested an unauthorized template capability');
}

const explicitNewAppIntent=(intent:string)=>['создай приложение','создать приложение','сделай приложение','собери приложение','новое приложение','новый mini app','новый мини','пересоздай','пересоздать','замени приложение','заменить приложение','начать заново','начни заново','start over','create app','create an app','new app','rebuild app','replace app'].some(signal=>intent.toLowerCase().includes(signal));
const explicitRemovalIntent=(intent:string)=>['убери','удали','отключи','remove','delete','disable'].some(signal=>intent.toLowerCase().includes(signal));
export function assertDestructivePlanIntent(plan:AIPlan,userIntent:string){for(const action of plan.actions){if(action.type==='create_from_template'&&!explicitNewAppIntent(userIntent))throw new AIServiceError('AI_INVALID_PLAN',502,'AI attempted to replace the app without explicit intent');if(action.type==='remove_module'&&!explicitRemovalIntent(userIntent))throw new AIServiceError('AI_INVALID_PLAN',502,'AI attempted to remove a module without explicit intent');}}

export function validatePlanAgainstCapabilities(plan:AIPlan,capabilities:ValidatedCapabilityManifest):AIPlan{
 const modules=new Map(capabilities.modules.map(item=>[item.type,item]));const tools=new Map(capabilities.tools.map(item=>[item.type,item]));const guards=new Map(capabilities.guards.map(item=>[item.type,item]));const templates=new Set(capabilities.templates.map(item=>item.id));
 for(const action of plan.actions){
  if(action.type==='create_from_template'&&!templates.has(action.payload.templateId))throw new AIServiceError('AI_INVALID_PLAN',502,'AI предложил недоступный шаблон');
  if('moduleType'in action.payload){const capability=modules.get(action.payload.moduleType);if(!capability)throw new AIServiceError('AI_INVALID_PLAN',502,`AI предложил недоступный модуль: ${action.payload.moduleType}`);if(action.type==='patch_module_config')assertPatchKeys(action.payload.patch,capability.defaultConfig,action.payload.moduleType);}
  if('toolType'in action.payload){const capability=tools.get(action.payload.toolType);if(!capability)throw new AIServiceError('AI_INVALID_PLAN',502,`AI предложил недоступный инструмент: ${action.payload.toolType}`);if(action.type==='patch_tool_config')assertPatchKeys(action.payload.patch,capability.defaultConfig,action.payload.toolType);}
  if('guardType'in action.payload){const capability=guards.get(action.payload.guardType);if(!capability)throw new AIServiceError('AI_INVALID_PLAN',502,`AI предложил недоступное правило доступа: ${action.payload.guardType}`);if(action.type==='patch_guard_config')assertPatchKeys(action.payload.patch,capability.defaultConfig,action.payload.guardType);}
 }
 return plan;
}

const safeUpstreamMessage=(status:number)=>{if(status===401||status===403)return new AIServiceError('AI_AUTH',503,'AI временно не настроен');if(status===429)return new AIServiceError('AI_RATE_LIMIT',429,'Слишком много AI-запросов. Попробуйте чуть позже.');if(status>=500)return new AIServiceError('AI_UPSTREAM',503,'AI временно недоступен');return new AIServiceError('AI_UPSTREAM_REQUEST',502,'AI не смог обработать запрос');};

export async function createOpenAIPlan(rawRequest:unknown,options:CreatePlanOptions):Promise<AIPlan>{
 const request:AIPlannerRequest=AIPlannerRequestSchema.parse(rawRequest);assertServerOwnedCapabilities(request.capabilities);
 const projectForModel=structuredClone(request.project);delete projectForModel.published;
 const modelInput=JSON.stringify({userRequest:request.message,conversation:request.conversation??[],currentProject:projectForModel,capabilities:request.capabilities,task:'Return the smallest useful AIPlan. The plan is only a proposal and will be validated again before execution.'});
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),options.timeoutMs??42_000);
 try{
  const response=await(options.fetchImpl??fetch)('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${options.apiKey}`,'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({model:options.model??DEFAULT_AI_MODEL,store:false,instructions:AI_COMPOSER_SYSTEM_PROMPT,input:modelInput,reasoning:{effort:'low'},max_output_tokens:3000,text:{verbosity:'low',format:{type:'json_schema',name:'escalita_ai_plan',strict:false,schema:AI_PLAN_JSON_SCHEMA}}})});
  const payload:unknown=await response.json().catch(()=>({}));
  if(!response.ok)throw safeUpstreamMessage(response.status);
  const usage=extractOpenAIUsage(payload);if(usage.inputTokens!==undefined||usage.outputTokens!==undefined||usage.totalTokens!==undefined)options.onUsage?.(usage);
  let decoded:unknown;try{decoded=JSON.parse(extractOpenAIOutputText(payload));}catch(error){if(error instanceof AIServiceError)throw error;throw new AIServiceError('AI_INVALID_JSON',502,'AI вернул некорректный план');}
  const parsed=AIPlanSchema.safeParse(decoded);if(!parsed.success)throw new AIServiceError('AI_INVALID_PLAN',502,'AI вернул план неправильного формата');
  const authoritative:AIPlan={...parsed.data,id:`remote-${crypto.randomUUID()}`,userIntent:request.message};
  assertDestructivePlanIntent(authoritative,request.message);
  return validatePlanAgainstCapabilities(authoritative,request.capabilities);
 }catch(error){if(controller.signal.aborted)throw new AIServiceError('AI_TIMEOUT',504,'AI не успел ответить. Попробуйте ещё раз.');throw error;}finally{clearTimeout(timeout);}
}
