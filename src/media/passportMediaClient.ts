import { z } from 'zod';
import { PassportMediaIdSchema } from '../modules/loyalty-passport/schema';
import { getTelegramInitData } from '../telegram/getTelegramInitData';
const ResponseSchema=z.object({mediaId:PassportMediaIdSchema,contentType:z.literal('image/jpeg'),bytes:z.number().int().positive().max(3*1024*1024),width:z.number().int().positive().max(4096),height:z.number().int().positive().max(4096)}).strict().refine(value=>value.width*value.height<=16_000_000);
export interface PassportMediaClientDeps { fetch:typeof fetch; getInitData:()=>string }
const messages:Record<string,string>={
  MEDIA_FILE_TOO_LARGE:'Файл слишком большой.',
  MEDIA_RATE_LIMIT:'Слишком много загрузок. Попробуйте через минуту.',
  MEDIA_INVALID_TYPE:'Неподдерживаемый формат изображения.',
  MEDIA_INVALID_JPEG:'Не удалось обработать изображение.',
  MEDIA_INVALID_FORM:'Не удалось подготовить изображение к загрузке.',
  MEDIA_INVALID_FILE:'Не удалось подготовить изображение к загрузке.',
  MEDIA_INVALID_PROJECT:'Не удалось определить проект. Обновите приложение и попробуйте снова.',
  CROSS_ORIGIN:'Загрузка доступна только внутри приложения.',
  MEDIA_NOT_CONFIGURED:'Хранилище временно недоступно. Попробуйте позже.',
  MEDIA_IDENTITY_ERROR:'Хранилище временно недоступно. Попробуйте позже.',
  MEDIA_STORAGE_PUT:'Хранилище временно недоступно. Попробуйте позже.',
  MEDIA_STORAGE_GET:'Хранилище временно недоступно. Попробуйте позже.',
  MEDIA_STORAGE_ERROR:'Хранилище временно недоступно. Попробуйте позже.',
};
const genericUploadError='Не удалось загрузить изображение. Попробуйте ещё раз.';
const genericStorageError='Хранилище временно недоступно. Попробуйте позже.';
export async function uploadPassportCover({projectId,file}:{projectId:string;file:File},deps:PassportMediaClientDeps={fetch,getInitData:getTelegramInitData}){
  const initData=deps.getInitData();
  if(!initData)throw new Error('Сессия Telegram устарела. Переоткройте приложение.');
  const body=new FormData();body.append('file',file);body.append('projectId',projectId);
  let response:Response;
  try{response=await deps.fetch('/api/media/passport-covers',{method:'POST',headers:{'X-Telegram-Init-Data':initData},body});}
  catch{throw new Error(genericStorageError);}
  if(!response.ok){
    const value=await response.json().catch(()=>({})) as {code?:string};
    if(response.status===401)throw new Error('Сессия Telegram устарела. Переоткройте приложение.');
    if(value.code&&messages[value.code])throw new Error(messages[value.code]);
    if(response.status>=400&&response.status<500)throw new Error(genericUploadError);
    throw new Error(genericStorageError);
  }
  const parsed=ResponseSchema.safeParse(await response.json());
  if(!parsed.success)throw new Error('Хранилище вернуло некорректный ответ.');
  return parsed.data;
}
