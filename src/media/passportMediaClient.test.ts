import { describe, expect, it } from 'vitest';
import { uploadPassportCover } from './passportMediaClient';
const mediaId='m1_abcdefghijklmnop_qrstuvwxyzABCDEF_123e4567-e89b-42d3-a456-426614174000';
const file=new Blob(['jpeg'],{type:'image/jpeg'}) as File;
const valid={mediaId,contentType:'image/jpeg',bytes:4,width:3,height:2};
const run=(response:Response,getInitData=()=> 'signed')=>uploadPassportCover({projectId:'project-1',file},{getInitData,fetch:async()=>response});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
describe('Passport media client',()=>{
  it('accepts a strict valid response',async()=>expect(run(json(valid))).resolves.toEqual(valid));
  it.each([{...valid,mediaId:'hello'},{...valid,contentType:'image/png'},{...valid,width:4097},{...valid,bytes:3*1024*1024+1},{...valid,extra:'no'}])('rejects invalid server response %j',async value=>expect(run(json(value))).rejects.toThrow('некорректный ответ'));
  it('maps missing and rejected Telegram sessions',async()=>{await expect(run(json(valid),()=> '')).rejects.toThrow('Сессия Telegram устарела');await expect(run(json({code:'TELEGRAM_AUTH_INVALID'},401))).rejects.toThrow('Сессия Telegram устарела')});
  it.each([
    ['MEDIA_FILE_TOO_LARGE','Файл слишком большой'],['MEDIA_PROJECT_QUOTA','В этом проекте достигнут лимит'],['MEDIA_USER_QUOTA','Достигнут лимит'],['MEDIA_RATE_LIMIT','Слишком много загрузок'],['MEDIA_INVALID_TYPE','Неподдерживаемый формат'],['MEDIA_INVALID_JPEG','Не удалось обработать изображение'],['MEDIA_NOT_CONFIGURED','Хранилище временно недоступно'],
  ])('maps %s to a friendly message',async(code,message)=>expect(run(json({code},code==='MEDIA_INVALID_TYPE'?415:code==='MEDIA_INVALID_JPEG'?400:429))).rejects.toThrow(message));
});
