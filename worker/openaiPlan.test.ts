import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../src/project/defaults';
import { buildCapabilityManifest } from '../src/ai/capabilities/buildCapabilityManifest';
import { AIServiceError, createOpenAIPlan, extractOpenAIOutputText } from './openaiPlan';

const request = (message='Поменяй название') => ({ message, project:createDefaultProject(), capabilities:buildCapabilityManifest() });
const modelPlan = (actions: unknown[]) => ({ id:'model-id', userIntent:'ignored', summary:'Готово', explanation:'После подтверждения', actions, missingInformation:[], suggestedQuestions:[], riskLevel:'low' });
const responseWithPlan = (value: unknown) => new Response(JSON.stringify({ output:[{ type:'message', content:[{ type:'output_text', text:JSON.stringify(value) }] }] }), { status:200, headers:{'content-type':'application/json'} });

describe('OpenAI plan adapter', () => {
  it('extracts output_text from Responses API payload', () => {
    expect(extractOpenAIOutputText({ output:[{content:[{type:'output_text',text:'{"ok":true}'}]}] })).toBe('{"ok":true}');
  });

  it('uses Responses API structured output and returns validated plan', async () => {
    let upstreamBody: any;
    const plan = await createOpenAIPlan(request(), {
      apiKey:'secret',
      fetchImpl: async (_input, init) => { upstreamBody = JSON.parse(String(init?.body)); return responseWithPlan(modelPlan([{type:'set_metadata',payload:{name:'Coffee 13'}}])); },
    });
    expect(plan.id).toMatch(/^remote-/);
    expect(plan.userIntent).toBe('Поменяй название');
    expect(upstreamBody.model).toBe('gpt-5.6-terra');
    expect(upstreamBody.store).toBe(false);
    expect(upstreamBody.text.format.type).toBe('json_schema');
  });

  it('rejects hallucinated capabilities before returning to the browser', async () => {
    await expect(createOpenAIPlan(request('Добавь booking'), {
      apiKey:'secret',
      fetchImpl: async () => responseWithPlan(modelPlan([{type:'add_module',payload:{moduleType:'booking'}}])),
    })).rejects.toMatchObject({ code:'AI_INVALID_PLAN' } satisfies Partial<AIServiceError>);
  });
});
