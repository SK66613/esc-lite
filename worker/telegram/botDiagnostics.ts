type TelegramApiEnvelope<T> = {
  ok?: unknown;
  result?: T;
};

type TelegramBotInfo = {
  id?: unknown;
  first_name?: unknown;
  username?: unknown;
};

type TelegramWebhookInfo = {
  url?: unknown;
  pending_update_count?: unknown;
  last_error_date?: unknown;
  last_error_message?: unknown;
  max_connections?: unknown;
  allowed_updates?: unknown;
};

export type SafeTelegramBotDiagnostics = {
  ok: true;
  bot: {
    id: string;
    username?: string;
    firstName?: string;
  };
  webhook: {
    configured: boolean;
    host?: string;
    pendingUpdateCount: number;
    lastErrorDate?: number;
    lastErrorMessage?: string;
    maxConnections?: number;
    allowedUpdates?: string[];
  };
};

export class TelegramBotDiagnosticsError extends Error {
  constructor(public readonly code: 'TELEGRAM_BOT_API_AUTH' | 'TELEGRAM_BOT_API_UPSTREAM', message: string) {
    super(message);
    this.name = 'TelegramBotDiagnosticsError';
  }
}

const callTelegram = async <T>(botToken: string, method: string, fetchImpl: typeof fetch): Promise<T> => {
  const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({})) as TelegramApiEnvelope<T>;
  if (!response.ok || payload.ok !== true || payload.result === undefined) {
    if (response.status === 401 || response.status === 404) {
      throw new TelegramBotDiagnosticsError('TELEGRAM_BOT_API_AUTH', 'Telegram bot token rejected');
    }
    throw new TelegramBotDiagnosticsError('TELEGRAM_BOT_API_UPSTREAM', 'Telegram Bot API unavailable');
  }
  return payload.result;
};

const webhookHost = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  try { return new URL(value).host; }
  catch { return undefined; }
};

export async function getTelegramBotDiagnostics(
  botToken: string,
  options: { fetchImpl?: typeof fetch } = {},
): Promise<SafeTelegramBotDiagnostics> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const [bot, webhook] = await Promise.all([
    callTelegram<TelegramBotInfo>(botToken, 'getMe', fetchImpl),
    callTelegram<TelegramWebhookInfo>(botToken, 'getWebhookInfo', fetchImpl),
  ]);

  if ((typeof bot.id !== 'number' && typeof bot.id !== 'string') || !String(bot.id)) {
    throw new TelegramBotDiagnosticsError('TELEGRAM_BOT_API_UPSTREAM', 'Telegram returned invalid bot info');
  }

  const rawWebhookUrl = typeof webhook.url === 'string' ? webhook.url : '';
  const host = webhookHost(rawWebhookUrl);
  const pending = typeof webhook.pending_update_count === 'number' && Number.isFinite(webhook.pending_update_count)
    ? webhook.pending_update_count
    : 0;

  return {
    ok: true,
    bot: {
      id: String(bot.id),
      ...(typeof bot.username === 'string' && bot.username ? { username: bot.username } : {}),
      ...(typeof bot.first_name === 'string' && bot.first_name ? { firstName: bot.first_name } : {}),
    },
    webhook: {
      configured: Boolean(rawWebhookUrl),
      ...(host ? { host } : {}),
      pendingUpdateCount: pending,
      ...(typeof webhook.last_error_date === 'number' ? { lastErrorDate: webhook.last_error_date } : {}),
      ...(typeof webhook.last_error_message === 'string' && webhook.last_error_message ? { lastErrorMessage:webhook.last_error_message.slice(0,500) } : {}),
      ...(typeof webhook.max_connections === 'number' ? { maxConnections:webhook.max_connections } : {}),
      ...(Array.isArray(webhook.allowed_updates) ? { allowedUpdates:webhook.allowed_updates.filter((item): item is string => typeof item === 'string').slice(0,30) } : {}),
    },
  };
}
