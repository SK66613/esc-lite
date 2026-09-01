import { ZodError } from 'zod';
import { AIServiceError, createOpenAIPlan, DEFAULT_AI_MODEL, type AIUsage } from './openaiPlan';
import { TelegramInitDataError, validateTelegramInitData } from './telegram/validateTelegramInitData';

interface Env{OPENAI_API_KEY?:string;OPENAI_MODEL?:string;TELEGRAM_BOT_TOKEN?:string;ASSETS:{fetch(request:Request):Promise<Response>};}
type Bucket={count:number;resetAt:number};
const buckets=new Map<string,Bucket>();const WINDOW_MS=60_000;const MAX_REQUESTS_PER_WINDOW=12;const MAX_BODY_CHARS=128_000;
const json=(value:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const allowRequest=(key:string,now=Date.now()):{allowed:boolean;retryAfter?:number}=>{if(buckets.size>2000)for(const[id,bucket]of buckets)if(bucket.resetAt<=now)buckets.delete(id);const current=buckets.get(key);if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+WINDOW_MS});return{allowed:true};}if(current.count>=MAX_REQUESTS_PER_WINDOW)return{allowed:false,retryAfter:Math.max(1,Math.ceil((current.resetAt-now)/1000))};current.count+=1;return{allowed:true};};
const safeUserLogId=async(userId:string)=>{const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(userId));return Array.from(new Uint8Array(digest).slice(0,8),byte=>byte.toString(16).padStart(2,'0')).join('');};
const log=(event:string,data:Record<string,unknown>)=>console.log(JSON.stringify({event,...data}));

const handleHealth=(request:Request,env:Env)=>request.method==='GET'?json({ok:true,aiConfigured:Boolean(env.OPENAI_API_KEY),telegramAuthConfigured:Boolean(env.TELEGRAM_BOT_TOKEN)}):json({code:'METHOD_NOT_ALLOWED',message:'Используйте GET'},405,{allow:'GET'});

const handleAIPlan=async(request:Request,env:Env):Promise<Response>=>{
 const requestId=crypto.randomUUID();const headers={'X-Request-Id':requestId};const started=Date.now();let userLogId:string|undefined;let model=env.OPENAI_MODEL??DEFAULT_AI_MODEL;let usage:AIUsage|undefined;
 const fail=(value:unknown,status:number,extra:Record<string,string>={})=>json(value,status,{...headers,...extra});
 if(request.method!=='POST')return fail({code:'METHOD_NOT_ALLOWED',message:'Используйте POST'},405,{allow:'POST'});
 const requestUrl=new URL(request.url);const origin=request.headers.get('origin');if(origin&&origin!==requestUrl.origin)return fail({code:'CROSS_ORIGIN',message:'AI endpoint доступен только из приложения'},403);
 if(!env.OPENAI_API_KEY||!env.TELEGRAM_BOT_TOKEN)return fail({code:'AI_NOT_CONFIGURED',message:'AI временно не настроен'},503);
 const initData=request.headers.get('X-Telegram-Init-Data')??'';
 if(!initData)return fail({code:'TELEGRAM_AUTH_REQUIRED',message:'Откройте Escalita внутри Telegram.'},401);
 let identity;
 try{identity=await validateTelegramInitData(initData,env.TELEGRAM_BOT_TOKEN);userLogId=await safeUserLogId(identity.userId);}catch(error){const code=error instanceof TelegramInitDataError?error.code:'TELEGRAM_AUTH_INVALID';return fail({code,message:code==='TELEGRAM_AUTH_REQUIRED'?'Откройте Escalita внутри Telegram.':'Сессия Telegram устарела. Переоткройте приложение.'},401);}
 const rate=allowRequest(`telegram:${identity.userId}`);if(!rate.allowed)return fail({code:'AI_RATE_LIMIT',message:'Слишком много AI-запросов. Попробуйте через минуту.'},429,{'retry-after':String(rate.retryAfter??60)});
 const text=await request.text();if(text.length>MAX_BODY_CHARS)return fail({code:'PAYLOAD_TOO_LARGE',message:'Запрос слишком большой'},413);
 let payload:unknown;try{payload=JSON.parse(text);}catch{return fail({code:'INVALID_JSON',message:'Некорректный запрос'},400);}
 log('ai_plan_start',{requestId,user:userLogId,model});
 try{
  const plan=await createOpenAIPlan(payload,{apiKey:env.OPENAI_API_KEY,model:env.OPENAI_MODEL,onUsage:value=>{usage=value;}});
  log('ai_plan_success',{requestId,user:userLogId,model,durationMs:Date.now()-started,actionCount:plan.actions.length,status:200,...(usage??{})});
  return json(plan,200,headers);
 }catch(error){
  let code='AI_INTERNAL',status=503,message='AI временно недоступен';
  if(error instanceof ZodError){code='INVALID_REQUEST';status=400;message='Некорректные данные проекта';}
  else if(error instanceof AIServiceError){code=error.code;status=error.status;message=error.message;}
  log('ai_plan_error',{requestId,user:userLogId,model,durationMs:Date.now()-started,status,errorCode:code,...(usage??{})});
  return fail({code,message},status);
 }
};

export default{async fetch(request:Request,env:Env):Promise<Response>{const url=new URL(request.url);if(url.pathname==='/api/health')return handleHealth(request,env);if(url.pathname==='/api/ai/plan')return handleAIPlan(request,env);if(url.pathname.startsWith('/api/'))return json({code:'NOT_FOUND',message:'API route not found'},404);return env.ASSETS.fetch(request);}};
