import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import type { AIPlanner, AIPlannerInput } from './AIPlanner';

type RemoteAIPlannerOptions = {
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const readRemoteError = (value: unknown, status: number): string => {
  if (value && typeof value === 'object') {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return `AI service returned ${status}`;
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
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(input),
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
