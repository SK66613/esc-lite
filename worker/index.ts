import { ZodError } from 'zod';
import { AIServiceError, createOpenAIPlan } from './openaiPlan';
import { TelegramInitDataError, validateTelegramInitData } from './telegram/validateTelegramInitData';

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_BODY_CHARS = 128_000;

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
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok:true, aiConfigured:Boolean(env.OPENAI_API_KEY), telegramAuthConfigured:Boolean(env.TELEGRAM_BOT_TOKEN) });
    if (url.pathname === '/api/ai/plan') return handleAIPlan(request, env);
    if (url.pathname.startsWith('/api/')) return json({ code:'NOT_FOUND', message:'API route not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
