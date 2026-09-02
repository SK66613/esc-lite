import { describe, expect, it } from 'vitest';
import worker from './index';

const mediaId='m1_abcdefghijklmnop_qrstuvwxyzABCDEF_123e4567-e89b-42d3-a456-426614174000';

describe('Worker media routing',()=>{
  it('returns a safe media 404 for malformed percent-encoded path data',async()=>{
    const response=await worker.fetch(new Request('https://app.test/api/media/passport-covers/%ZZ'),{ASSETS:{fetch:async()=>new Response('asset')}} as any);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({code:'MEDIA_NOT_FOUND',message:'Медиа не найдено'});
  });
  it('routes safe media diagnostics without exposing configuration values',async()=>{
    const response=await worker.fetch(new Request('https://app.test/api/media/diagnostics'),{
      ASSETS:{fetch:async()=>new Response('asset')},
      MEDIA_SIGNING_SECRET:'secret',
      MEDIA_BUCKET:{list:async()=>({objects:[]}),put:async()=>undefined,get:async()=>null},
    } as any);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok:true,configured:true,identity:true,storageList:true});
  });
});
