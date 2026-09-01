import { ZodError } from 'zod';
import { AIServiceError, createOpenAIPlan } from './openaiPlan';

interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
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
  if (request.method !== 'POST') return json({ code:'METHOD_NOT_ALLOWED', message:'Используйте POST' }, 405, { allow:'POST' });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && origin !== requestUrl.origin) return json({ code:'CROSS_ORIGIN', message:'AI endpoint доступен только из приложения' }, 403);
  if (!env.OPENAI_API_KEY) return json({ code:'AI_NOT_CONFIGURED', message:'AI временно не настроен' }, 503);

  const rate = allowRequest(request.headers.get('cf-connecting-ip') ?? 'unknown');
  if (!rate.allowed) return json({ code:'AI_RATE_LIMIT', message:'Слишком много AI-запросов. Попробуйте через минуту.' }, 429, { 'retry-after':String(rate.retryAfter ?? 60) });

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return json({ code:'PAYLOAD_TOO_LARGE', message:'Запрос слишком большой' }, 413);
  let payload: unknown;
  try { payload = JSON.parse(text); }
  catch { return json({ code:'INVALID_JSON', message:'Некорректный запрос' }, 400); }

  try {
    const plan = await createOpenAIPlan(payload, { apiKey:env.OPENAI_API_KEY, model:env.OPENAI_MODEL });
    return json(plan);
  } catch (error) {
    if (error instanceof ZodError) return json({ code:'INVALID_REQUEST', message:'Некорректные данные проекта' }, 400);
    if (error instanceof AIServiceError) return json({ code:error.code, message:error.message }, error.status);
    console.error('AI planner failed', error instanceof Error ? error.name : 'UnknownError');
    return json({ code:'AI_INTERNAL', message:'AI временно недоступен' }, 503);
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/plan') return handleAIPlan(request, env);
    if (url.pathname.startsWith('/api/')) return json({ code:'NOT_FOUND', message:'API route not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
