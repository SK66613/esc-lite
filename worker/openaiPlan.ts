import type { AIPlan } from '../src/ai/schema/AIPlanSchema';
import { AIPlanSchema } from '../src/ai/schema/AIPlanSchema';
import { AIPlannerRequestSchema, type AIPlannerRequest, type ValidatedCapabilityManifest } from '../src/ai/schema/AIPlannerRequestSchema';
import { AI_COMPOSER_SYSTEM_PROMPT } from '../src/ai/prompts/systemPrompt';
import { AI_PLAN_JSON_SCHEMA } from './aiPlanJsonSchema';
import { SERVER_ALLOWED_CAPABILITY_IDS } from '../src/ai/capabilities/allowedCapabilityIds';
import { SERVER_MODULE_CONFIG_OPTION_POLICY } from '../src/ai/capabilities/serverConfigOptionPolicy';
import { PASSPORT_VISUAL_VARIANTS, passportVariantSupports, type PassportPresentationAxis, type PassportVisualVariant } from '../src/modules/loyalty-passport/presentation/options';
import { PassportStampContentMapSchema } from '../src/modules/loyalty-passport/schema';

export const DEFAULT_AI_MODEL = 'gpt-5.6-terra';

export class AIServiceError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message); this.name = 'AIServiceError';
  }
}

export type AIUsage = { inputTokens?: number; outputTokens?: number; totalTokens?: number };
type CreatePlanOptions = { apiKey: string; model?: string; fetchImpl?: typeof fetch; timeoutMs?: number; onUsage?: (usage: AIUsage) => void };

type OpenAIResponseLike = { output_text?: unknown; output?: unknown; error?: { message?: unknown } };

export function extractOpenAIOutputText(value: unknown): string {
  const root = (value && typeof value === 'object' ? value : {}) as OpenAIResponseLike;
  if (typeof root.output_text === 'string' && root.output_text.trim()) return root.output_text;
  if (!Array.isArray(root.output)) throw new AIServiceError('AI_EMPTY_RESPONSE', 502, 'AI вернул пустой ответ');
  for (const item of root.output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const typed = part as { type?: unknown; text?: unknown; refusal?: unknown };
      if (typed.type === 'refusal') throw new AIServiceError('AI_REFUSED', 422, 'AI не смог обработать этот запрос');
      if (typed.type === 'output_text' && typeof typed.text === 'string' && typed.text.trim()) return typed.text;
    }
  }
  throw new AIServiceError('AI_EMPTY_RESPONSE', 502, 'AI вернул пустой ответ');
}

const configKeys = (value: unknown): Set<string> | null => value && typeof value === 'object' && !Array.isArray(value) ? new Set(Object.keys(value as Record<string, unknown>)) : null;
const assertPatchKeys = (patchValue: unknown, defaultConfig: unknown, label: string) => {
  if (!patchValue || typeof patchValue !== 'object' || Array.isArray(patchValue)) return;
  const allowed = configKeys(defaultConfig);
  if (!allowed) return;
  for (const key of Object.keys(patchValue as Record<string, unknown>)) if (!allowed.has(key)) throw new AIServiceError('AI_INVALID_PLAN', 502, `AI предложил неизвестную настройку ${label}.${key}`);
};

export function validatePlanAgainstCapabilities(plan: AIPlan, capabilities: ValidatedCapabilityManifest, project?:AIPlannerRequest['project']): AIPlan {
  const modules = new Map(capabilities.modules.map((item) => [item.type, item]));
  const tools = new Map(capabilities.tools.map((item) => [item.type, item]));
  const guards = new Map(capabilities.guards.map((item) => [item.type, item]));
  const templates = new Set(capabilities.templates.map((item) => item.id));
  for (const action of plan.actions) {
    if (action.type === 'create_from_template' && !templates.has(action.payload.templateId)) throw new AIServiceError('AI_INVALID_PLAN', 502, 'AI предложил недоступный шаблон');
    if ('moduleType' in action.payload) {
      const capability = modules.get(action.payload.moduleType);
      if (!capability) throw new AIServiceError('AI_INVALID_PLAN', 502, `AI предложил недоступный модуль: ${action.payload.moduleType}`);
      if (action.type === 'patch_module_config') {
        assertPatchKeys(action.payload.patch, capability.defaultConfig, action.payload.moduleType);
        if(action.payload.moduleType==='loyalty_passport'&&'stampContent' in action.payload.patch){
          const parsed=PassportStampContentMapSchema.safeParse(action.payload.patch.stampContent);
          if(parsed.success&&Object.values(parsed.data).some(item=>item?.cover?.source==='media'))throw new AIServiceError('AI_INVALID_PLAN',502,'AI не может выбирать пользовательские медиа');
          if(!parsed.success)throw new AIServiceError('AI_INVALID_PLAN',502,'AI предложил некорректное содержание этапов');
          const patchedGoal=action.payload.patch.goal;
          const currentConfig=project?.modules.find(module=>module.type==='loyalty_passport')?.config;
          const currentGoal=currentConfig&&typeof currentConfig==='object'&&!Array.isArray(currentConfig)?(currentConfig as Record<string,unknown>).goal:undefined;
          const effectiveGoal=typeof patchedGoal==='number'&&Number.isInteger(patchedGoal)&&patchedGoal>=1&&patchedGoal<=30?patchedGoal:typeof currentGoal==='number'&&Number.isInteger(currentGoal)&&currentGoal>=1&&currentGoal<=30?currentGoal:6;
          if(Object.keys(parsed.data).some(position=>Number(position)>effectiveGoal))throw new AIServiceError('AI_INVALID_PLAN',502,'AI предложил этап выше текущей цели');
        }
        const policy=SERVER_MODULE_CONFIG_OPTION_POLICY[action.payload.moduleType as keyof typeof SERVER_MODULE_CONFIG_OPTION_POLICY];
        if(policy&&'presentation' in action.payload.patch){
          const presentation=action.payload.patch.presentation;
          if(!presentation||typeof presentation!=='object'||Array.isArray(presentation)) throw new AIServiceError('AI_INVALID_PLAN',502,'AI предложил некорректную presentation настройку');
          for(const [axis,value] of Object.entries(presentation as Record<string,unknown>)){
            const path=`presentation.${axis}` as keyof typeof policy; const allowed=policy[path];
            if(!allowed||(allowed as readonly unknown[]).includes(value)===false) throw new AIServiceError('AI_INVALID_PLAN',502,`AI предложил недопустимую настройку ${path}`);
          }
          const proposed=(presentation as Record<string,unknown>).visualVariant;
          const current=project?.modules.find(module=>module.type==='loyalty_passport')?.config;
          const currentVariant=current&&typeof current==='object'&&!Array.isArray(current)&&(current as Record<string,unknown>).presentation;
          const currentId=currentVariant&&typeof currentVariant==='object'&&!Array.isArray(currentVariant)?(currentVariant as Record<string,unknown>).visualVariant:undefined;
          const effective=(typeof proposed==='string'&&PASSPORT_VISUAL_VARIANTS.includes(proposed as PassportVisualVariant)?proposed:typeof currentId==='string'&&PASSPORT_VISUAL_VARIANTS.includes(currentId as PassportVisualVariant)?currentId:'classic_grid') as PassportVisualVariant;
          for(const axis of Object.keys(presentation as Record<string,unknown>)) if(axis!=='visualVariant'&&!passportVariantSupports(effective,axis as PassportPresentationAxis)) throw new AIServiceError('AI_INVALID_PLAN',502,`Вариант ${effective} не поддерживает presentation.${axis}`);
        }
      }
    }
    if ('toolType' in action.payload) {
      const capability = tools.get(action.payload.toolType);
      if (!capability) throw new AIServiceError('AI_INVALID_PLAN', 502, `AI предложил недоступный инструмент: ${action.payload.toolType}`);
      if (action.type === 'patch_tool_config') assertPatchKeys(action.payload.patch, capability.defaultConfig, action.payload.toolType);
    }
    if ('guardType' in action.payload) {
      const capability = guards.get(action.payload.guardType);
      if (!capability) throw new AIServiceError('AI_INVALID_PLAN', 502, `AI предложил недоступное правило доступа: ${action.payload.guardType}`);
      if (action.type === 'patch_guard_config') assertPatchKeys(action.payload.patch, capability.defaultConfig, action.payload.guardType);
    }
  }
  return plan;
}

function assertServerAllowedCapabilities(capabilities: ValidatedCapabilityManifest) {
  const groups = [
    [capabilities.modules, SERVER_ALLOWED_CAPABILITY_IDS.modules, 'type'],
    [capabilities.tools, SERVER_ALLOWED_CAPABILITY_IDS.tools, 'type'],
    [capabilities.guards, SERVER_ALLOWED_CAPABILITY_IDS.guards, 'type'],
    [capabilities.templates, SERVER_ALLOWED_CAPABILITY_IDS.templates, 'id'],
  ] as const;
  for (const [items, allowed, key] of groups) for (const item of items)
    if (!allowed.has((item as Record<string,string>)[key] as never)) throw new AIServiceError('AI_INVALID_PLAN', 400, 'Client supplied an unavailable capability');
}

const CREATE_INTENT = /(?:созда(?:й|ть)|сделай)\s+(?:нов(?:ое|ый|ую)\s+)?(?:приложени|mini.?app)|(?:замени|пересоздай|начни\s+(?:сначала|заново)|start over|replace|create (?:a )?new app)/iu;
const REMOVE_INTENT = /(?:убери|удали|отключи|remove|delete|disable)\b/iu;
export function validatePlanRisk(plan: AIPlan, message: string): AIPlan {
  if (plan.actions.some((action) => action.type === 'create_from_template') && !CREATE_INTENT.test(message))
    throw new AIServiceError('AI_INVALID_PLAN', 422, 'Template replacement requires explicit intent');
  if (plan.actions.some((action) => action.type === 'remove_module') && !REMOVE_INTENT.test(message))
    throw new AIServiceError('AI_INVALID_PLAN', 422, 'Module removal requires explicit intent');
  return plan;
}

const safeUpstreamMessage = (status: number) => {
  if (status === 401 || status === 403) return new AIServiceError('AI_AUTH', 503, 'AI временно не настроен');
  if (status === 429) return new AIServiceError('AI_RATE_LIMIT', 429, 'Слишком много AI-запросов. Попробуйте чуть позже.');
  if (status >= 500) return new AIServiceError('AI_UPSTREAM', 503, 'AI временно недоступен');
  return new AIServiceError('AI_UPSTREAM_REQUEST', 502, 'AI не смог обработать запрос');
};

export async function createOpenAIPlan(rawRequest: unknown, options: CreatePlanOptions): Promise<AIPlan> {
  const request: AIPlannerRequest = AIPlannerRequestSchema.parse(rawRequest);
  assertServerAllowedCapabilities(request.capabilities);
  const projectForModel = structuredClone(request.project);
  delete projectForModel.published;
  const modelInput = JSON.stringify({
    userRequest: request.message,
    conversation: request.conversation ?? [],
    currentProject: projectForModel,
    capabilities: request.capabilities,
    task: 'Return the smallest useful AIPlan. The plan is only a proposal and will be validated again before execution.',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 42_000);
  try {
    const response = await (options.fetchImpl ?? fetch)('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${options.apiKey}`, 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: options.model ?? DEFAULT_AI_MODEL,
        store: false,
        instructions: AI_COMPOSER_SYSTEM_PROMPT,
        input: modelInput,
        reasoning: { effort: 'low' },
        max_output_tokens: 3500,
        text: {
          verbosity: 'low',
          format: { type:'json_schema', name:'escalita_ai_plan', strict:false, schema:AI_PLAN_JSON_SCHEMA },
        },
      }),
    });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) throw safeUpstreamMessage(response.status);
    if (payload && typeof payload === 'object') {
      const usage = (payload as { usage?: Record<string, unknown> }).usage;
      if (usage) options.onUsage?.({
        ...(typeof usage.input_tokens === 'number' ? { inputTokens:usage.input_tokens } : {}),
        ...(typeof usage.output_tokens === 'number' ? { outputTokens:usage.output_tokens } : {}),
        ...(typeof usage.total_tokens === 'number' ? { totalTokens:usage.total_tokens } : {}),
      });
    }
    let decoded: unknown;
    try { decoded = JSON.parse(extractOpenAIOutputText(payload)); }
    catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError('AI_INVALID_JSON', 502, 'AI вернул некорректный план');
    }
    const parsed = AIPlanSchema.safeParse(decoded);
    if (!parsed.success) throw new AIServiceError('AI_INVALID_PLAN', 502, 'AI вернул план неправильного формата');
    const authoritative: AIPlan = { ...parsed.data, id:`remote-${crypto.randomUUID()}`, userIntent:request.message };
    return validatePlanRisk(validatePlanAgainstCapabilities(authoritative, request.capabilities,request.project), request.message);
  } catch (error) {
    if (controller.signal.aborted) throw new AIServiceError('AI_TIMEOUT', 504, 'AI не успел ответить. Попробуйте ещё раз.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
