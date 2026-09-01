import { describe, expect, it } from 'vitest';
import { getTelegramBotDiagnostics, TelegramBotDiagnosticsError } from './botDiagnostics';

const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { 'content-type':'application/json' },
});

describe('getTelegramBotDiagnostics', () => {
  it('returns safe bot identity and redacted webhook information', async () => {
    const diagnostics = await getTelegramBotDiagnostics('secret', {
      fetchImpl: async (input) => String(input).endsWith('/getMe')
        ? response({ ok:true, result:{ id:42, first_name:'Escalita', username:'escalita_bot' } })
        : response({ ok:true, result:{ url:'https://old.example.com/tg/hook-secret-path', pending_update_count:3, last_error_message:'Connection refused', max_connections:40, allowed_updates:['message'] } }),
    });
    expect(diagnostics.bot).toMatchObject({ id:'42', username:'escalita_bot' });
    expect(diagnostics.webhook).toMatchObject({ configured:true, host:'old.example.com', pendingUpdateCount:3, lastErrorMessage:'Connection refused' });
    expect(JSON.stringify(diagnostics)).not.toContain('hook-secret-path');
  });

  it('does not expose a token when Telegram rejects it', async () => {
    await expect(getTelegramBotDiagnostics('super-secret', {
      fetchImpl: async () => response({ ok:false }, 401),
    })).rejects.toBeInstanceOf(TelegramBotDiagnosticsError);
  });
});
