import { describe, expect, it } from 'vitest';
import worker from './index';

describe('Worker media routing',()=>{
  it('returns a safe media 404 for malformed percent-encoded path data',async()=>{
    const response=await worker.fetch(new Request('https://app.test/api/media/passport-covers/%ZZ'),{ASSETS:{fetch:async()=>new Response('asset')}} as any);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({code:'MEDIA_NOT_FOUND',message:'Медиа не найдено'});
  });
});
