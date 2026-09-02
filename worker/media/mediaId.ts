import {PASSPORT_MEDIA_ID_PATTERN} from '../../src/modules/loyalty-passport/schema';
const encode=(bytes:ArrayBuffer)=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function scope(secret:string,value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return encode(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))).slice(0,16);}
export async function createMediaIdentity(secret:string,userId:string,projectId:string,uuid=crypto.randomUUID()){const ownerScope=await scope(secret,`owner:${userId}`),projectScope=await scope(secret,`project:${userId}:${projectId}`);return {ownerScope,projectScope,mediaId:`m1_${ownerScope}_${projectScope}_${uuid}`};}
export const isMediaId=(value:string)=>PASSPORT_MEDIA_ID_PATTERN.test(value);
export const mediaKey=(mediaId:string)=>`passport-media/v1/${mediaId}.jpg`;
