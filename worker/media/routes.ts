import { isProjectId } from '../../src/project/id';
import { TelegramInitDataError, validateTelegramInitData } from '../telegram/validateTelegramInitData';
import { inspectJPEG, JPEGError } from './jpeg';
import { createMediaIdentity, isMediaId, mediaKey } from './mediaId';

export interface MediaObject { body: BodyInit; etag?: string; httpEtag?: string }
export interface MediaBucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: Record<string,string>; customMetadata?: Record<string,string> }): Promise<unknown>;
  get(key: string): Promise<MediaObject | null>;
  list(options: { prefix: string; limit?: number }): Promise<{ objects: unknown[]; truncated?: boolean; cursor?: string }>;
}
export interface MediaEnv { MEDIA_BUCKET?: MediaBucket; MEDIA_SIGNING_SECRET?: string; TELEGRAM_BOT_TOKEN?: string }
type Identity = { ownerScope:string; projectScope:string; mediaId:string };
export interface MediaRouteDeps {
  validateAuth: (initData:string, token:string) => Promise<{userId:string}>;
  now: () => number;
  createIdentity: (secret:string,userId:string,projectId:string) => Promise<Identity>;
  rates: Map<string,{count:number;reset:number}>;
}
export const createMediaRouteDeps = (overrides:Partial<MediaRouteDeps> = {}):MediaRouteDeps => ({
  validateAuth:validateTelegramInitData, now:Date.now, createIdentity:createMediaIdentity, rates:new Map(), ...overrides,
});
const productionDeps=createMediaRouteDeps();
const CACHE_CONTROL='public, max-age=31536000, immutable';
const MAX_FILE_BYTES=3*1024*1024;
const MAX_MULTIPART_BYTES=4*1024*1024;
const json=(body:unknown,status:number)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const error=(code:string,status:number,message:string)=>json({code,message},status);
const storageError=(operation:string)=>{console.error(JSON.stringify({event:'passport_media_storage_error',operation,code:'MEDIA_STORAGE_ERROR'}));return error('MEDIA_STORAGE_ERROR',503,'Хранилище временно недоступно');};

export async function handleMediaUpload(request:Request,env:MediaEnv,deps=productionDeps) {
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(origin&&origin!==url.origin)return error('CROSS_ORIGIN',403,'Запрос доступен только из приложения');
  if(!env.MEDIA_BUCKET||!env.MEDIA_SIGNING_SECRET)return error('MEDIA_NOT_CONFIGURED',503,'Хранилище временно недоступно');
  if(!env.TELEGRAM_BOT_TOKEN)return error('TELEGRAM_AUTH_REQUIRED',401,'Требуется Telegram');
  const init=request.headers.get('X-Telegram-Init-Data');
  if(!init)return error('TELEGRAM_AUTH_REQUIRED',401,'Требуется Telegram');
  let userId:string;
  try { userId=(await deps.validateAuth(init,env.TELEGRAM_BOT_TOKEN)).userId; }
  catch(e) { if(e instanceof TelegramInitDataError||e instanceof Error)return error('TELEGRAM_AUTH_INVALID',401,'Сессия Telegram устарела'); throw e; }
  const now=deps.now(),rate=deps.rates.get(userId);
  if(rate&&rate.reset>now&&rate.count>=6)return error('MEDIA_RATE_LIMIT',429,'Слишком много загрузок');
  if(!rate||rate.reset<=now)deps.rates.set(userId,{count:1,reset:now+60_000});else rate.count++;
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;'))return error('MEDIA_INVALID_FORM',400,'Ожидается multipart/form-data');
  const declaredLength=request.headers.get('content-length');
  if(declaredLength&&/^\d+$/.test(declaredLength)&&Number(declaredLength)>MAX_MULTIPART_BYTES)return error('MEDIA_FILE_TOO_LARGE',413,'Файл слишком большой');
  let form:FormData;try{form=await request.formData();}catch{return error('MEDIA_INVALID_FORM',400,'Некорректная форма');}
  const files=form.getAll('file');if(files.length!==1||!(files[0] instanceof File))return error('MEDIA_INVALID_FILE',400,'Нужен один файл');
  const file=files[0],projectId=form.get('projectId');
  if(!isProjectId(projectId))return error('MEDIA_INVALID_PROJECT',400,'Некорректный проект');
  if(file.type!=='image/jpeg')return error('MEDIA_INVALID_TYPE',415,'Разрешён только JPEG');
  if(file.size>MAX_FILE_BYTES)return error('MEDIA_FILE_TOO_LARGE',413,'Файл слишком большой');
  const buffer=await file.arrayBuffer();let dimensions;
  try{dimensions=inspectJPEG(new Uint8Array(buffer));}catch(e){if(e instanceof JPEGError)return error('MEDIA_INVALID_JPEG',400,'Некорректный JPEG');throw e;}
  const identity=await deps.createIdentity(env.MEDIA_SIGNING_SECRET,userId,projectId);
  const base='passport-media/v1/';
  try {
    const owner=await env.MEDIA_BUCKET.list({prefix:`${base}m1_${identity.ownerScope}_`,limit:101});
    if(owner.objects.length>=100)return error('MEDIA_USER_QUOTA',429,'Лимит файлов пользователя исчерпан');
    const project=await env.MEDIA_BUCKET.list({prefix:`${base}m1_${identity.ownerScope}_${identity.projectScope}_`,limit:41});
    if(project.objects.length>=40)return error('MEDIA_PROJECT_QUOTA',429,'Лимит файлов проекта исчерпан');
    await env.MEDIA_BUCKET.put(mediaKey(identity.mediaId),buffer,{httpMetadata:{contentType:'image/jpeg',cacheControl:CACHE_CONTROL},customMetadata:{ownerScope:identity.ownerScope,projectScope:identity.projectScope,width:String(dimensions.width),height:String(dimensions.height),createdAt:new Date(now).toISOString()}});
  } catch { return storageError('upload'); }
  return json({mediaId:identity.mediaId,contentType:'image/jpeg',bytes:file.size,...dimensions},201);
}

export async function handleMediaGet(mediaId:string,env:MediaEnv) {
  if(!isMediaId(mediaId)||!env.MEDIA_BUCKET)return error('MEDIA_NOT_FOUND',404,'Медиа не найдено');
  let object:MediaObject|null;try{object=await env.MEDIA_BUCKET.get(mediaKey(mediaId));}catch{return storageError('get');}
  if(!object)return error('MEDIA_NOT_FOUND',404,'Медиа не найдено');
  const headers=new Headers({'content-type':'image/jpeg','cache-control':CACHE_CONTROL,'x-content-type-options':'nosniff'});
  if(object.httpEtag||object.etag)headers.set('etag',object.httpEtag??object.etag!);
  return new Response(object.body,{headers});
}
