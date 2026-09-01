import { describe, expect, it } from 'vitest';
import { TelegramInitDataError, validateTelegramInitData } from './validateTelegramInitData';

const token = '123456:fake-token-for-tests';
const now = 2_000_000_000;
const hex = (value: ArrayBuffer) => [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
async function signed(overrides: Record<string,string> = {}) {
  const params = new URLSearchParams({ auth_date:String(now), query_id:'test', user:JSON.stringify({ id:42, username:'coffee', first_name:'Ada' }), ...overrides });
  const check = [...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
  const encoder = new TextEncoder();
  const first = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', first, encoder.encode(token));
  const second = await crypto.subtle.importKey('raw', secret, { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  params.set('hash', hex(await crypto.subtle.sign('HMAC', second, encoder.encode(check))));
  return params.toString();
}

describe('validateTelegramInitData', () => {
  it('accepts a valid signature and extracts identity after validation', async () => expect(await validateTelegramInitData(await signed(), token, { nowSeconds:now })).toEqual({ userId:'42', username:'coffee', firstName:'Ada', authDate:now }));
  it('rejects an invalid hash', async () => expect(validateTelegramInitData(`${await signed()}x`, token, { nowSeconds:now })).rejects.toBeInstanceOf(TelegramInitDataError));
  it('rejects a missing hash', async () => expect(validateTelegramInitData('auth_date=1', token, { nowSeconds:now })).rejects.toBeInstanceOf(TelegramInitDataError));
  it('rejects expired auth_date', async () => expect(validateTelegramInitData(await signed({auth_date:String(now-86401)}), token, { nowSeconds:now })).rejects.toBeInstanceOf(TelegramInitDataError));
  it('rejects malformed signed user JSON', async () => expect(validateTelegramInitData(await signed({user:'{'}), token, { nowSeconds:now })).rejects.toBeInstanceOf(TelegramInitDataError));
});
