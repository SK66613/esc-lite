import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../project/defaults';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { MAX_AI_CONVERSATION_CHARS, MAX_AI_CONVERSATION_TURNS } from './AIPlanner';
import { RemoteAIPlanner } from './RemoteAIPlanner';

const plan = { id:'remote-1', userIntent:'Поменяй название', summary:'Поменяю название', explanation:'После подтверждения.', actions:[{type:'set_metadata',payload:{name:'Coffee 13'}}], missingInformation:[], suggestedQuestions:[], riskLevel:'low' };
const baseInput = () => ({ message:'Поменяй название', project:createDefaultProject(), capabilities:buildCapabilityManifest() });

describe('RemoteAIPlanner', () => {
  it('sends Telegram initData only in the auth header and validates AIPlan', async () => {
    let sentBody: any;
    let sentHeaders: Headers | undefined;
    const planner = new RemoteAIPlanner({
      getInitData: () => 'query_id=abc&hash=signed',
      fetchImpl: async (_input, init) => {
        sentBody = JSON.parse(String(init?.body));
        sentHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify(plan), { status:200, headers:{'content-type':'application/json','x-request-id':'req-1'} });
      },
    });
    const result = await planner.plan(baseInput());
    expect(result.actions[0]).toMatchObject({ type:'set_metadata' });
    expect(sentHeaders?.get('x-telegram-init-data')).toBe('query_id=abc&hash=signed');
    expect(JSON.stringify(sentBody)).not.toContain('query_id=abc&hash=signed');
  });

  it('bounds conversation before sending it', async () => {
    let sentBody: any;
    const planner = new RemoteAIPlanner({
      getInitData: () => 'signed',
      fetchImpl: async (_input, init) => {
        sentBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify(plan), { status:200 });
      },
    });
    const conversation = Array.from({length:20}, (_,index) => ({ role:index % 2 ? 'assistant' as const : 'user' as const, content:'x'.repeat(1500) }));
    await planner.plan({ ...baseInput(), conversation });
    expect(sentBody.conversation.length).toBeLessThanOrEqual(MAX_AI_CONVERSATION_TURNS);
    expect(sentBody.conversation.reduce((sum:number, turn:{content:string}) => sum + turn.content.length, 0)).toBeLessThanOrEqual(MAX_AI_CONVERSATION_CHARS);
  });

  it('maps server auth errors to safe Russian messages', async () => {
    const planner = new RemoteAIPlanner({
      getInitData: () => '',
      fetchImpl: async () => new Response(JSON.stringify({ code:'TELEGRAM_AUTH_REQUIRED', message:'internal' }), { status:401 }),
    });
    await expect(planner.plan(baseInput())).rejects.toThrow('Откройте Escalita внутри Telegram.');
  });
});
