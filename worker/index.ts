import { ZodError } from 'zod';
import { AIServiceError, createOpenAIPlan } from './openaiPlan';
import { TelegramInitDataError, validateTelegramInitData } from './telegram/validateTelegramInitData';
import { getTelegramBotDiagnostics, TelegramBotDiagnosticsError } from './telegram/botDiagnostics';
import {handleMediaDiagnostics,handleMediaGet,handleMediaUpload,type MediaBucket} from './media/routes';

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  MEDIA_BUCKET?: MediaBucket;
  MEDIA_SIGNING_SECRET?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_BODY_CHARS = 128_000;
const PASSPORT_MEDIA_PATH_PREFIX='/api/media/passport-covers/';

const json = (value: unknown, status = 200, headers: Record<string,string> = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...headers },
});

const allowRequest = (key: string, now = Date.now()): { allowed: boolean; retryAfter?: number } => {
  if (buckets.size > 2000) for (const [id, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(id);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count:1, resetAt:now + WINDOW_MS }); return { allowed:true }; }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return { allowed:false, retryAfter:Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1;
  return { allowed:true };
};

const handleTelegramDiagnostics = async (env: Env): Promise<Response> => {
  if (!env.TELEGRAM_BOT_TOKEN) return json({ ok:false, code:'TELEGRAM_NOT_CONFIGURED', message:'Telegram bot token is not configured' }, 503);
  try {
    return json(await getTelegramBotDiagnostics(env.TELEGRAM_BOT_TOKEN));
  } catch (error) {
    if (error instanceof TelegramBotDiagnosticsError) {
      const status = error.code === 'TELEGRAM_BOT_API_AUTH' ? 502 : 503;
      return json({ ok:false, code:error.code, message:error.code === 'TELEGRAM_BOT_API_AUTH' ? 'Telegram rejected the configured bot token' : 'Telegram Bot API is temporarily unavailable' }, status);
    }
    return json({ ok:false, code:'TELEGRAM_DIAGNOSTICS_FAILED', message:'Telegram diagnostics failed' }, 503);
  }
};

const handleAIPlan = async (request: Request, env: Env): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const respond = (value: unknown, status = 200, headers: Record<string,string> = {}) => json(value, status, { 'X-Request-Id':requestId, ...headers });
  const logError = (code: string, status: number) => console.error(JSON.stringify({ event:'ai_plan_error', requestId, durationMs:Date.now()-startedAt, status, errorCode:code }));
  if (request.method !== 'POST') return respond({ code:'METHOD_NOT_ALLOWED', message:'Используйте POST' }, 405, { allow:'POST' });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== requestUrl.origin) return respond({ code:'CROSS_ORIGIN', message:'AI endpoint доступен только из приложения' }, 403);
  if (!env.OPENAI_API_KEY || !env.TELEGRAM_BOT_TOKEN) return respond({ code:'AI_NOT_CONFIGURED', message:'AI временно не настроен' }, 503);

  const initData = request.headers.get('X-Telegram-Init-Data');
  if (!initData) return respond({ code:'TELEGRAM_AUTH_REQUIRED', message:'Откройте Escalita внутри Telegram.' }, 401);
  let telegramUserId: string;
  try { telegramUserId = (await validateTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN)).userId; }
  catch (error) {
    if (error instanceof TelegramInitDataError) return respond({ code:'TELEGRAM_AUTH_INVALID', message:'Сессия Telegram устарела. Переоткройте приложение.' }, 401);
    throw error;
  }
  console.log(JSON.stringify({ event:'ai_plan_start', requestId, telegramUserId, model:env.OPENAI_MODEL ?? 'default' }));

  const rate = allowRequest(`telegram:${telegramUserId}`);
  if (!rate.allowed) return respond({ code:'AI_RATE_LIMIT', message:'Слишком много AI-запросов. Попробуйте через минуту.' }, 429, { 'retry-after':String(rate.retryAfter ?? 60) });

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return respond({ code:'PAYLOAD_TOO_LARGE', message:'Запрос слишком большой' }, 413);
  let payload: unknown;
  try { payload = JSON.parse(text); }
  catch { return respond({ code:'INVALID_JSON', message:'Некорректный запрос' }, 400); }

  try {
    let usage = {};
    const plan = await createOpenAIPlan(payload, { apiKey:env.OPENAI_API_KEY, model:env.OPENAI_MODEL, onUsage:value => { usage=value; } });
    console.log(JSON.stringify({ event:'ai_plan_success', requestId, telegramUserId, model:env.OPENAI_MODEL ?? 'default', durationMs:Date.now()-startedAt, actionCount:plan.actions.length, ...usage }));
    return respond(plan);
  } catch (error) {
    if (error instanceof ZodError) { logError('INVALID_REQUEST', 400); return respond({ code:'INVALID_REQUEST', message:'Некорректные данные проекта' }, 400); }
    if (error instanceof AIServiceError) { logError(error.code, error.status); return respond({ code:error.code, message:error.message }, error.status); }
    logError('AI_INTERNAL', 503);
    return respond({ code:'AI_INTERNAL', message:'AI временно недоступен' }, 503);
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok:true, aiConfigured:Boolean(env.OPENAI_API_KEY), telegramAuthConfigured:Boolean(env.TELEGRAM_BOT_TOKEN), mediaConfigured:Boolean(env.MEDIA_BUCKET && env.MEDIA_SIGNING_SECRET) });
    if (url.pathname === '/api/telegram/diagnostics' && request.method === 'GET') return handleTelegramDiagnostics(env);
    if (url.pathname === '/api/media/diagnostics' && request.method === 'GET') return handleMediaDiagnostics(env);
    if (url.pathname === '/api/ai/plan') return handleAIPlan(request, env);
    if (url.pathname === '/api/media/passport-covers' && request.method === 'POST') return handleMediaUpload(request, env);
    if (url.pathname.startsWith(PASSPORT_MEDIA_PATH_PREFIX) && request.method === 'GET') return handleMediaGet(url.pathname.slice(PASSPORT_MEDIA_PATH_PREFIX.length), env);
    if (url.pathname.startsWith('/api/')) return json({ code:'NOT_FOUND', message:'API route not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
