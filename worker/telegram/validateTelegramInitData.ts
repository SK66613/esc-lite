export const TELEGRAM_INIT_DATA_TTL_SECONDS = 24 * 60 * 60;
const FUTURE_SKEW_SECONDS = 5 * 60;
const encoder = new TextEncoder();

export type TelegramIdentity={userId:string;username?:string;firstName?:string;lastName?:string;authDate:number};

export class TelegramInitDataError extends Error {
  constructor(public readonly code:'TELEGRAM_AUTH_REQUIRED'|'TELEGRAM_AUTH_INVALID', message:string){super(message);this.name='TelegramInitDataError';}
}

const hmacSha256=async(key:BufferSource,data:string):Promise<Uint8Array>=>{
  const cryptoKey=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,encoder.encode(data)));
};

const hex=(bytes:Uint8Array)=>Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
const constantTimeEqual=(left:string,right:string)=>{
  if(left.length!==right.length)return false;
  let diff=0;
  for(let i=0;i<left.length;i+=1)diff|=left.charCodeAt(i)^right.charCodeAt(i);
  return diff===0;
};

export async function validateTelegramInitData(initData:string,botToken:string,options:{nowMs?:number;ttlSeconds?:number}={}):Promise<TelegramIdentity>{
  if(!initData.trim())throw new TelegramInitDataError('TELEGRAM_AUTH_REQUIRED','Telegram initData is required');
  const params=new URLSearchParams(initData);
  const receivedHash=params.get('hash');
  if(!receivedHash||!/^[0-9a-f]{64}$/i.test(receivedHash))throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Invalid Telegram hash');
  const dataCheckString=Array.from(params.entries()).filter(([key])=>key!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
  const secretKey=await hmacSha256(encoder.encode('WebAppData'),botToken);
  const calculatedHash=hex(await hmacSha256(secretKey,dataCheckString));
  if(!constantTimeEqual(calculatedHash.toLowerCase(),receivedHash.toLowerCase()))throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Invalid Telegram signature');
  const authDate=Number(params.get('auth_date'));
  if(!Number.isInteger(authDate)||authDate<=0)throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Invalid Telegram auth date');
  const now=Math.floor((options.nowMs??Date.now())/1000);
  const ttl=options.ttlSeconds??TELEGRAM_INIT_DATA_TTL_SECONDS;
  if(authDate>now+FUTURE_SKEW_SECONDS||now-authDate>ttl)throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Telegram session expired');
  const rawUser=params.get('user');
  if(!rawUser)throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Telegram user missing');
  let user:Record<string,unknown>;
  try{const parsed=JSON.parse(rawUser);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();user=parsed as Record<string,unknown>;}catch{throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Invalid Telegram user');}
  const id=user.id;
  if((typeof id!=='number'&&typeof id!=='string')||String(id).trim()==='')throw new TelegramInitDataError('TELEGRAM_AUTH_INVALID','Telegram user id missing');
  return {userId:String(id),authDate,...(typeof user.username==='string'?{username:user.username}:{}),...(typeof user.first_name==='string'?{firstName:user.first_name}:{}),...(typeof user.last_name==='string'?{lastName:user.last_name}:{})};
}
