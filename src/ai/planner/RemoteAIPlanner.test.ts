import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../project/defaults';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { RemoteAIPlanner } from './RemoteAIPlanner';

const plan = { id:'remote-1', userIntent:'Поменяй название', summary:'Поменяю название', explanation:'После подтверждения.', actions:[{type:'set_metadata',payload:{name:'Coffee 13'}}], missingInformation:[], suggestedQuestions:[], riskLevel:'low' };

describe('RemoteAIPlanner', () => {
  it('posts current context and validates returned AIPlan', async () => {
    let sent: unknown;
    const planner = new RemoteAIPlanner({
      fetchImpl: async (_input, init) => {
        sent = JSON.parse(String(init?.body));
        return new Response(JSON.stringify(plan), { status: 200, headers: { 'content-type': 'application/json' } });
      },
    });
    const result = await planner.plan({ message:'Поменяй название', project:createDefaultProject(), capabilities:buildCapabilityManifest() });
    expect(result.actions[0]).toMatchObject({ type:'set_metadata' });
    expect(sent).toMatchObject({ message:'Поменяй название' });
  });

  it('surfaces safe backend errors', async () => {
    const planner = new RemoteAIPlanner({ fetchImpl: async () => new Response(JSON.stringify({ message:'AI временно недоступен' }), { status:503 }) });
    await expect(planner.plan({ message:'test', project:createDefaultProject(), capabilities:buildCapabilityManifest() })).rejects.toThrow('AI временно недоступен');
  });

  it('bounds conversation and sends initData only in the auth header', async () => {
    const previousWindow = (globalThis as any).window;
    (globalThis as any).window = { Telegram:{ WebApp:{ initData:'signed-secret-data' } } };
    let sentBody = ''; let sentHeaders: Headers | undefined;
    try {
      const planner = new RemoteAIPlanner({ fetchImpl:async (_input, init) => {
        sentBody = String(init?.body); sentHeaders = new Headers(init?.headers);
        return new Response(JSON.stringify(plan), { status:200 });
      }});
      await planner.plan({ message:'Темнее', project:createDefaultProject(), capabilities:buildCapabilityManifest(), conversation:Array.from({length:12},(_,index)=>({role:'user' as const,content:`turn-${index}`})) });
      expect(JSON.parse(sentBody).conversation).toHaveLength(8);
      expect(JSON.parse(sentBody).conversation[0].content).toBe('turn-4');
      expect(sentHeaders?.get('X-Telegram-Init-Data')).toBe('signed-secret-data');
      expect(sentBody).not.toContain('signed-secret-data');
    } finally { (globalThis as any).window = previousWindow; }
  });
});
