export const TELEGRAM_INIT_DATA_TTL_SECONDS = 24 * 60 * 60;

export type TelegramIdentity = {
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  authDate: number;
};

export class TelegramInitDataError extends Error {}

const bytesToHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

export async function validateTelegramInitData(
  initData: string,
  botToken: string,
  options: { nowSeconds?: number; ttlSeconds?: number } = {},
): Promise<TelegramIdentity> {
  const params = new URLSearchParams(initData);
  const suppliedHash = params.get('hash');
  if (!suppliedHash || !/^[a-f0-9]{64}$/i.test(suppliedHash)) throw new TelegramInitDataError('Invalid Telegram init data');
  params.delete('hash');
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
  const validationKey = await crypto.subtle.importKey('raw', secret, { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const calculatedHash = bytesToHex(await crypto.subtle.sign('HMAC', validationKey, encoder.encode(dataCheckString)));
  if (!constantTimeEqual(calculatedHash, suppliedHash.toLowerCase())) throw new TelegramInitDataError('Invalid Telegram init data');

  const authDate = Number(params.get('auth_date'));
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = options.ttlSeconds ?? TELEGRAM_INIT_DATA_TTL_SECONDS;
  if (!Number.isInteger(authDate) || authDate <= 0 || authDate > now + 60 || now - authDate > ttl) throw new TelegramInitDataError('Invalid Telegram init data');
  let user: { id?: unknown; username?: unknown; first_name?: unknown; last_name?: unknown };
  try { user = JSON.parse(params.get('user') ?? ''); } catch { throw new TelegramInitDataError('Invalid Telegram init data'); }
  if ((typeof user.id !== 'number' && typeof user.id !== 'string') || !String(user.id)) throw new TelegramInitDataError('Invalid Telegram init data');
  return {
    userId:String(user.id), authDate,
    ...(typeof user.username === 'string' ? { username:user.username } : {}),
    ...(typeof user.first_name === 'string' ? { firstName:user.first_name } : {}),
    ...(typeof user.last_name === 'string' ? { lastName:user.last_name } : {}),
  };
}
