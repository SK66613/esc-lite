import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import type { AIPlanner, AIPlannerInput } from './AIPlanner';
import { getTelegramInitData } from '../../telegram/getTelegramInitData';
import { MAX_CONVERSATION_CHARS, MAX_CONVERSATION_TURNS } from '../schema/AIPlannerRequestSchema';

type RemoteAIPlannerOptions = {
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const FRIENDLY_ERRORS: Record<string, string> = {
  TELEGRAM_AUTH_REQUIRED: 'Переоткройте приложение в Telegram.', TELEGRAM_AUTH_INVALID: 'Переоткройте приложение в Telegram.',
  AI_RATE_LIMIT: 'Слишком много запросов. Попробуйте через минуту.', AI_TIMEOUT: 'AI отвечает дольше обычного. Попробуйте ещё раз.',
  AI_NOT_CONFIGURED: 'AI временно не подключён.', AI_UPSTREAM: 'AI временно недоступен. Попробуйте ещё раз.',
  AI_INVALID_PLAN: 'AI не смог безопасно собрать изменения. Попробуйте сформулировать иначе.',
};
const readRemoteError = (value: unknown, status: number): string => {
  if (value && typeof value === 'object') {
    const code = (value as { code?: unknown }).code;
    if (typeof code === 'string' && FRIENDLY_ERRORS[code]) return FRIENDLY_ERRORS[code];
  }
  return status === 429 ? FRIENDLY_ERRORS.AI_RATE_LIMIT : 'AI временно недоступен. Попробуйте ещё раз.';
};

export class RemoteAIPlanner implements AIPlanner {
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RemoteAIPlannerOptions = {}) {
    this.endpoint = options.endpoint ?? '/api/ai/plan';
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async plan(input: AIPlannerInput): Promise<AIPlan> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let chars = 0;
      const conversation = (input.conversation ?? []).slice(-MAX_CONVERSATION_TURNS).reverse().filter((turn) => {
        if (chars + turn.content.length > MAX_CONVERSATION_CHARS) return false;
        chars += turn.content.length; return true;
      }).reverse();
      const initData = getTelegramInitData();
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'accept': 'application/json', ...(initData ? { 'X-Telegram-Init-Data':initData } : {}) },
        body: JSON.stringify({ ...input, conversation }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => undefined);
      if (!response.ok) throw new Error(readRemoteError(payload, response.status));
      const parsed = AIPlanSchema.safeParse(payload);
      if (!parsed.success) throw new Error('AI service returned an invalid plan');
      return parsed.data;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('AI не успел ответить. Попробуйте ещё раз.');
      if (error instanceof Error) throw error;
      throw new Error('Не удалось связаться с AI.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
