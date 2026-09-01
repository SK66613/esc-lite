import { getTelegramInitData } from '../../telegram/getTelegramInitData';
import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import { boundAIConversation, type AIPlanner, type AIPlannerInput } from './AIPlanner';

type RemoteAIPlannerOptions = {
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  getInitData?: () => string;
};

type RemoteErrorPayload = { code?: unknown; message?: unknown };

const friendlyErrors: Record<string, string> = {
  TELEGRAM_AUTH_REQUIRED: 'Откройте Escalita внутри Telegram.',
  TELEGRAM_AUTH_INVALID: 'Сессия Telegram устарела. Переоткройте приложение.',
  AI_RATE_LIMIT: 'Слишком много запросов. Попробуйте через минуту.',
  AI_TIMEOUT: 'AI отвечает дольше обычного. Попробуйте ещё раз.',
  AI_NOT_CONFIGURED: 'AI временно не настроен.',
  AI_AUTH: 'AI временно не настроен.',
  AI_UPSTREAM: 'AI временно недоступен. Попробуйте ещё раз.',
  AI_INVALID_PLAN: 'AI не смог безопасно собрать изменения. Попробуйте сформулировать иначе.',
};

export class RemoteAIPlannerError extends Error {
  constructor(public readonly code: string, message: string, public readonly requestId?: string) {
    super(message);
    this.name = 'RemoteAIPlannerError';
  }
}

const readRemoteError = (value: unknown, status: number, requestId?: string): RemoteAIPlannerError => {
  const payload = value && typeof value === 'object' ? value as RemoteErrorPayload : {};
  const code = typeof payload.code === 'string' ? payload.code : `HTTP_${status}`;
  const fallback = typeof payload.message === 'string' && payload.message.trim() ? payload.message : 'Не удалось связаться с AI.';
  return new RemoteAIPlannerError(code, friendlyErrors[code] ?? fallback, requestId);
};

export class RemoteAIPlanner implements AIPlanner {
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly getInitData: () => string;

  constructor(options: RemoteAIPlannerOptions = {}) {
    this.endpoint = options.endpoint ?? '/api/ai/plan';
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.getInitData = options.getInitData ?? getTelegramInitData;
  }

  async plan(input: AIPlannerInput): Promise<AIPlan> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const initData = this.getInitData();
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
        },
        body: JSON.stringify({ ...input, conversation: boundAIConversation(input.conversation) }),
        signal: controller.signal,
      });
      const requestId = response.headers.get('x-request-id') ?? undefined;
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) throw readRemoteError(payload, response.status, requestId);
      const parsed = AIPlanSchema.safeParse(payload);
      if (!parsed.success) throw new RemoteAIPlannerError('AI_INVALID_PLAN', friendlyErrors.AI_INVALID_PLAN, requestId);
      return parsed.data;
    } catch (error) {
      if (controller.signal.aborted) throw new RemoteAIPlannerError('AI_TIMEOUT', friendlyErrors.AI_TIMEOUT);
      if (error instanceof Error) throw error;
      throw new RemoteAIPlannerError('AI_NETWORK', 'Не удалось связаться с AI.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
