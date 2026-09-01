import { describe, expect, it } from 'vitest';
import { TelegramInitDataError, validateTelegramInitData } from './validateTelegramInitData';

const TOKEN='123456:TEST_TOKEN';
const NOW_MS=1_800_000_000_000;
const encoder=new TextEncoder();
const asArrayBuffer=(value:Uint8Array):ArrayBuffer=>value.slice().buffer as ArrayBuffer;
const hmac=async(key:Uint8Array,data:string)=>{const cryptoKey=await crypto.subtle.importKey('raw',asArrayBuffer(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,encoder.encode(data)));};
const toHex=(bytes:Uint8Array)=>Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');

async function signedInitData(overrides:Record<string,string>={}){
  const values={auth_date:String(Math.floor(NOW_MS/1000)-60),query_id:'AAEAAAE',user:JSON.stringify({id:42,first_name:'Ada',username:'ada'}),...overrides};
  const params=new URLSearchParams(values);
  const check=Array.from(params.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
  const secret=await hmac(encoder.encode('WebAppData'),TOKEN);
  params.set('hash',toHex(await hmac(secret,check)));
  return params.toString();
}

describe('validateTelegramInitData',()=>{
  it('accepts valid Telegram initData and extracts identity',async()=>{const identity=await validateTelegramInitData(await signedInitData(),TOKEN,{nowMs:NOW_MS});expect(identity).toMatchObject({userId:'42',username:'ada',firstName:'Ada'});});
  it('rejects a missing hash',async()=>{await expect(validateTelegramInitData('auth_date=1&user=%7B%22id%22%3A42%7D',TOKEN,{nowMs:NOW_MS})).rejects.toBeInstanceOf(TelegramInitDataError);});
  it('rejects a forged hash',async()=>{const value=await signedInitData();await expect(validateTelegramInitData(value.replace('Ada','Eve'),TOKEN,{nowMs:NOW_MS})).rejects.toMatchObject({code:'TELEGRAM_AUTH_INVALID'});});
  it('rejects expired auth_date',async()=>{const value=await signedInitData({auth_date:String(Math.floor(NOW_MS/1000)-25*60*60)});await expect(validateTelegramInitData(value,TOKEN,{nowMs:NOW_MS})).rejects.toMatchObject({code:'TELEGRAM_AUTH_INVALID'});});
  it('rejects malformed signed user JSON',async()=>{const value=await signedInitData({user:'{broken'});await expect(validateTelegramInitData(value,TOKEN,{nowMs:NOW_MS})).rejects.toMatchObject({code:'TELEGRAM_AUTH_INVALID'});});
  it('never trusts a forged user id',async()=>{const value=await signedInitData();const changed=new URLSearchParams(value);changed.set('user',JSON.stringify({id:999}));await expect(validateTelegramInitData(changed.toString(),TOKEN,{nowMs:NOW_MS})).rejects.toMatchObject({code:'TELEGRAM_AUTH_INVALID'});});
});
