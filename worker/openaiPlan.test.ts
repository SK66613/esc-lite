import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../src/project/defaults';
import { buildCapabilityManifest } from '../src/ai/capabilities/buildCapabilityManifest';
import { AIServiceError, createOpenAIPlan, extractOpenAIOutputText, validatePlanRisk } from './openaiPlan';

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
  it('rejects template replacement for incremental shop and follow-up requests', () => {
    expect(() => validatePlanRisk(modelPlan([{type:'create_from_template',payload:{templateId:'store'}}]) as any, 'Добавь магазин')).toThrowError(AIServiceError);
    expect(() => validatePlanRisk(modelPlan([{type:'create_from_template',payload:{templateId:'coffee'}}]) as any, 'а теперь сделай темнее')).toThrowError(AIServiceError);
  });
  it('allows a template for explicit new app intent', () => expect(validatePlanRisk(modelPlan([{type:'create_from_template',payload:{templateId:'store'}}]) as any, 'Создай новое приложение магазина').actions).toHaveLength(1));
  it('rejects implicit module removal', () => expect(() => validatePlanRisk(modelPlan([{type:'remove_module',payload:{moduleType:'offers'}}]) as any, 'Сделай проще')).toThrowError(AIServiceError));
});

describe('server-owned Passport presentation policy',()=>{
 const passportAction=(presentation:unknown)=>({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{presentation}}});
 it('accepts one valid multi-axis patch',async()=>{const actions=[passportAction({visualVariant:'punch_card',headerMode:'hero',stampShape:'square',progressMode:'counter'})];await expect(createOpenAIPlan(request('Скомпонуй карточку'),{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan(actions))})).resolves.toMatchObject({actions});});
 it.each([{visualVariant:'premium_card'},{headerMode:'cinematic'},{columns:5},{unknownAxis:true},'punch_card'])('rejects invalid nested presentation %j',async(presentation)=>{await expect(createOpenAIPlan(request(),{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([passportAction(presentation)]))})).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});
 it('cannot be widened by a tampered client manifest',async()=>{const tampered=request() as any;tampered.capabilities=structuredClone(tampered.capabilities);tampered.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.configOptions['presentation.visualVariant'].values.push('premium_card');await expect(createOpenAIPlan(tampered,{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([passportAction({visualVariant:'premium_card'})]))})).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});
});

describe('server-owned variant support matrix',()=>{
 const configuredRequest=(variant:string)=>{const value=request();const module=value.project.modules.find(m=>m.type==='loyalty_passport')!;(module.config as any).presentation.visualVariant=variant;return value};
 const action=(presentation:Record<string,unknown>)=>({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{presentation}}});
 const run=(req:ReturnType<typeof request>,presentation:Record<string,unknown>)=>createOpenAIPlan(req,{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([action(presentation)]))});
 it('rejects columns for current minimal counter',async()=>await expect(run(configuredRequest('minimal_counter'),{columns:4})).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('accepts hero header for current punch card',async()=>await expect(run(configuredRequest('punch_card'),{headerMode:'hero'})).resolves.toBeDefined());
 it('rejects image aspect for current punch card',async()=>await expect(run(configuredRequest('punch_card'),{imageAspect:'portrait'})).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('uses the target variant from the same patch',async()=>await expect(run(configuredRequest('minimal_counter'),{visualVariant:'collection_gallery',columns:4,imageAspect:'portrait'})).resolves.toBeDefined());
 it('ignores tampered client support metadata',async()=>{const req=configuredRequest('minimal_counter') as any;req.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.presentationVariants.find((v:any)=>v.id==='minimal_counter').supports.push('columns');await expect(run(req,{columns:4})).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});
});

describe('server-owned Passport stamp policy',()=>{
 const action=(patch:Record<string,unknown>)=>({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch}});
 const run=(patch:Record<string,unknown>,req=request())=>createOpenAIPlan(req,{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([action(patch)]))});
 it('accepts sparse content and positions enabled by a goal raised in the patch',async()=>{await expect(run({stampContent:{'2':{title:'Покраска'}}})).resolves.toBeDefined();await expect(run({goal:7,stampContent:{'7':{iconKey:'gift'}}})).resolves.toBeDefined();});
 it.each([{stampContent:[]},{stampContent:'bad'},{stampContent:{'0':{title:'x'}}},{stampContent:{'31':{title:'x'}}},{stampContent:{foo:{title:'x'}}},{stampContent:{'1':{}}},{stampContent:{'1':{iconKey:'custom_svg'}}}])('rejects malformed server-side content %j',async patch=>await expect(run(patch as any)).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('rejects a position above current goal',async()=>await expect(run({stampContent:{'7':{title:'Будущее'}}})).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('cannot be widened by tampered icon metadata',async()=>{const req=request() as any;req.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.configStructures.stampContent.fields.iconKey.values.push('custom_svg');await expect(run({stampContent:{'1':{iconKey:'custom_svg'}}},req)).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});
});

describe('server-owned Passport cover policy',()=>{
 const action=(patch:Record<string,unknown>)=>({type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch}});
 const run=(patch:Record<string,unknown>,req=request())=>createOpenAIPlan(req,{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([action(patch)]))});
 it('accepts valid cover patches and a cover enabled by a raised goal',async()=>{await expect(run({stampContent:{'2':{cover:{source:'catalog',assetId:'repair-tools'}}}})).resolves.toBeDefined();await expect(run({goal:7,stampContent:{'7':{cover:{source:'catalog',assetId:'gift-box'}}}})).resolves.toBeDefined();});
 it.each([{source:'external',assetId:'gift-box'},{source:'catalog',assetId:'custom-cover'},{source:'catalog',assetId:'gift-box',url:'x'}])('rejects invalid cover %j',async cover=>await expect(run({stampContent:{'2':{cover}}})).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('rejects cover positions above effective goal',async()=>await expect(run({stampContent:{'7':{cover:{source:'catalog',assetId:'gift-box'}}}})).rejects.toMatchObject({code:'AI_INVALID_PLAN'}));
 it('cannot be widened by tampered client cover metadata',async()=>{const req=request() as any;req.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.coverAssets.push({id:'custom-cover',title:'Custom',category:'custom',keywords:['custom']});req.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.configStructures.stampContent.fields.cover.fields.assetId.values.push('custom-cover');await expect(run({stampContent:{'2':{cover:{source:'catalog',assetId:'custom-cover'}}}},req)).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});
});

describe('user media AI boundary',()=>{it('rejects syntactically valid media selected by AI',async()=>{const mediaId='m1_abcdefghijklmnop_qrstuvwxyzABCDEF_123e4567-e89b-42d3-a456-426614174000';await expect(createOpenAIPlan(request('Поставь фото'),{apiKey:'secret',fetchImpl:async()=>responseWithPlan(modelPlan([{type:'patch_module_config',payload:{moduleType:'loyalty_passport',patch:{stampContent:{'2':{cover:{source:'media',mediaId}}}}}}]))})).rejects.toMatchObject({code:'AI_INVALID_PLAN'});});});
